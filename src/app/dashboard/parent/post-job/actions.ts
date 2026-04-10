"use server";

import crypto from "crypto";

import { requireUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { jobs, parentProfiles, children, users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { createJobSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

import { syncUser } from "@/lib/user-sync";
import { stripe } from "@/lib/stripe";
import { sendEscrowReceiptEmail } from "@/lib/email";

export async function checkIsPremium() {
  const serverUser = await requireUser();
  const [user] = await db.select().from(users).where(eq(users.id, serverUser.uid)).limit(1);
  return !!user?.isPremium;
}

export async function getPaymentIntentStatus(paymentIntentId: string) {
  const user = await requireUser();
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // convert to dollars
      currency: paymentIntent.currency,
      id: paymentIntent.id
    };
  } catch (err: any) {
    console.error("Error retrieving payment intent:", err.message);
    throw new Error("Could not retrieve payment information.");
  }
}

export async function sendReceiptEmail(details: { amount: number; hours: number; rate: number; fee: number; transactionId: string }) {
  const user = await requireUser();
  
  // Fetch family name from DB since Firebase Admin session doesn't store it
  const profile = await db.query.parentProfiles.findFirst({
    where: eq(parentProfiles.id, user.uid)
  });
  
  const userName = profile?.familyName || "Kindred Parent";
  const userEmail = user.email || "";

  if (!userEmail) throw new Error("Could not find user email for receipt delivery.");

  const result = await sendEscrowReceiptEmail(userEmail, userName, details);
  if (!result.success) throw new Error(result.error);
  return { success: true };
}

export async function getLatestJobDraft() {
  const user = await requireUser();
  const draft = await db.query.jobs.findFirst({
    where: (jobs, { and, eq }) => and(eq(jobs.parentId, user.uid), eq(jobs.isDraft, true)),
    orderBy: (jobs, { desc }) => [desc(jobs.createdAt)]
  });
  return draft;
}

async function syncChildDetails(data: any, childIds: string[], userId: string) {
    if (!childIds || childIds.length === 0) return;

    for (const id of childIds) {
        const medical = data[`child_${id}_medical`];
        const interestsRaw = data[`child_${id}_interests`];
        
        if (medical !== undefined || interestsRaw !== undefined) {
            const updates: any = {};
            if (medical !== undefined) updates.medicalNotes = medical;
            if (interestsRaw !== undefined) {
                updates.interests = Array.isArray(interestsRaw) ? interestsRaw : interestsRaw.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            
            await db.update(children)
                .set(updates)
                .where(and(eq(children.id, id), eq(children.parentId, userId)));
        }
    }
}

export async function upsertJobDraft(data: any) {
  const user = await requireUser();
  
  // Clean the data - only take what's relevant to jobs table
  const { location, duration, childCount, minRate, maxRate, certs, duties, requirements, language, description, scheduleType, schedule, specificDates, isFeatured, isBoosted, hiringType, retainerBudget, startDate, selectedChildrenIds, isFastTrack, philosophy } = data;

  // Check if active draft exists
  const existingDraft = await getLatestJobDraft();

  const title = duration ? `${duration} Care in ${location || 'Pending Location'}` : "New Job Draft";
  const budget = `$${minRate || 20}-$${maxRate || 30}/hr`;

  // Sync child details
  if (selectedChildrenIds && selectedChildrenIds.length > 0) {
    await syncChildDetails(data, selectedChildrenIds, user.uid);
  }

  if (existingDraft) {
    await db.update(jobs).set({
      location: location || existingDraft.location,
      duration: duration || existingDraft.duration,
      startDate: startDate ? new Date(startDate) : existingDraft.startDate,
      childCount: childCount || existingDraft.childCount,
      selectedChildIds: selectedChildrenIds || existingDraft.selectedChildIds,
      isPriority: isFastTrack !== undefined ? isFastTrack : existingDraft.isPriority,
      minRate: minRate || existingDraft.minRate,
      maxRate: maxRate || existingDraft.maxRate,
      description: description || existingDraft.description,
      scheduleType: scheduleType || existingDraft.scheduleType,
      schedule: schedule || existingDraft.schedule,
      specificDates: specificDates || existingDraft.specificDates,
      isFeatured: isFeatured !== undefined ? isFeatured : existingDraft.isFeatured,
      isBoosted: isBoosted !== undefined ? isBoosted : existingDraft.isBoosted,
      hiringType: hiringType || existingDraft.hiringType,
      retainerBudget: retainerBudget || existingDraft.retainerBudget,
      requirements: requirements || existingDraft.requirements,
      duties: duties || existingDraft.duties || "",
      language: language || existingDraft.language,
      title,
      budget,
      updatedAt: new Date(),
    }).where(eq(jobs.id, existingDraft.id));
    return { id: existingDraft.id };
  } else {
    const newId = crypto.randomUUID();
    await db.insert(jobs).values({
      id: newId,
      parentId: user.uid,
      title,
      description: description || "",
      budget,
      minRate: minRate || 20,
      maxRate: maxRate || 30,
      location: location || null,
      duration: duration || null,
      startDate: startDate ? new Date(startDate) : null,
      childCount: childCount || 1,
      selectedChildIds: selectedChildrenIds || [],
      isPriority: isFastTrack || false,
      status: "open",
      isDraft: true,
      scheduleType: scheduleType || "recurring",
      hiringType: hiringType || "hourly",
      retainerBudget: retainerBudget || 1200,
      schedule: schedule || {},
      specificDates: specificDates || [],
      isFeatured: isFeatured || false,
      isBoosted: isBoosted || false,
      requirements: requirements || {},
      duties: duties || "",
      language: language || "English",
    });
    return { id: newId };
  }
}

export async function deleteJobDraft() {
  const user = await requireUser();
  await db.delete(jobs).where(and(eq(jobs.parentId, user.uid), eq(jobs.isDraft, true)));
}

export async function createJob(data: any) {
  const user = await requireUser();

  console.log(`[createJob] Starting for user ${user.uid}. Intent: ${data.stripePaymentIntentId}`);

  await syncUser();

  // Rate limit: 5 jobs per minute per user
  const { success } = await rateLimit(`createJob:${user.uid}`, "strict");
  if (!success) throw new Error("Too many requests. Please try again later.");

  // Validate input
  const parsed = createJobSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((e) => e.message).join(", "));
  }

  const { 
    location, duration, childCount, minRate, maxRate, certs, duties, 
    description: userDescription, stripePaymentIntentId, scheduleType, 
    schedule, specificDates, hiringType, retainerBudget, startDate, 
    selectedChildrenIds, isFastTrack, requirements, language
  } = parsed.data;

  // Sync child details
  if (selectedChildrenIds && selectedChildrenIds.length > 0) {
    await syncChildDetails(data, selectedChildrenIds, user.uid);
  }

  // Idempotency: Ensure this payment intent hasn't ALREADY been used for a live job
  if (stripePaymentIntentId) {
    const [existingJob] = await db.select().from(jobs)
      .where(and(eq(jobs.stripePaymentIntentId, stripePaymentIntentId), eq(jobs.isDraft, false)))
      .limit(1);
    
    if (existingJob) {
      console.warn(`[createJob] Blocked duplicate submission for PI: ${stripePaymentIntentId}`);
      throw new Error("This payment has already been used to post a job. Redirecting to dashboard...");
    }
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.uid)).limit(1);
  const isPremium = dbUser?.isPremium;
  const isElite = dbUser?.subscriptionTier === "elite";

  // Verify Payment Intent with Stripe ONLY if not Premium
  if (!isPremium) {
    if (!stripePaymentIntentId) throw new Error("Payment authorization required for non-premium accounts.");
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
      console.log(`[createJob] Stripe Intent Status: ${paymentIntent.status}, Amount: ${paymentIntent.amount}`);

      if (paymentIntent.status === "requires_payment_method") {
        throw new Error("Your payment authorization is incomplete or mismatched. Please return to Step 4 (Payment) to re-authorize the correct amount.");
      }

      if (!['requires_capture', 'succeeded', 'processing'].includes(paymentIntent.status)) {
        throw new Error(`Payment verification failed: Status "${paymentIntent.status}" is not valid for posting a job.`);
      }
    } catch (err: any) {
      console.error("[createJob] Stripe Verification Error:", err.message, err.stack);
      throw new Error(`Escrow verification failed: ${err.message}. If you were already charged, please go back to Step 4 to sync your authorized payment.`);
    }
  }

  const title = `${duration} Care in ${location}`;
  const description = userDescription || "";
  const budget = `$${minRate}-$${maxRate}/hr`;

  // Elite Perk: Automatic/Free Featured and Boosted status
  const finalFeatured = isElite || data.isFeatured || false;
  const finalBoosted = isElite || data.isBoosted || false;

  // Try to find existing draft to update instead of fresh insert
  const draft = await getLatestJobDraft();

  if (draft) {
    await db.update(jobs).set({
      title,
      description,
      budget,
      minRate,
      maxRate,
      location,
      duration,
      startDate: startDate ? new Date(startDate) : null,
      childCount,
      selectedChildIds: selectedChildrenIds,
      isPriority: isFastTrack,
      hiringType,
      retainerBudget,
      status: "open",
      scheduleType,
      schedule,
      specificDates,
      stripePaymentIntentId: isPremium ? null : stripePaymentIntentId,
      isFeatured: finalFeatured,
      isBoosted: finalBoosted,
      isDraft: false,
      requirements,
      duties,
      language,
      createdAt: new Date(),
    }).where(eq(jobs.id, draft.id));
  } else {
    await db.insert(jobs).values({
      id: crypto.randomUUID(),
      parentId: user.uid,
      title,
      description,
      budget,
      minRate,
      maxRate,
      location,
      duration,
      startDate: startDate ? new Date(startDate) : null,
      childCount,
      selectedChildIds: selectedChildrenIds,
      isPriority: isFastTrack,
      hiringType: hiringType || "hourly",
      retainerBudget: retainerBudget || 1200,
      status: "open",
      scheduleType,
      schedule,
      specificDates,
      stripePaymentIntentId: isPremium ? null : stripePaymentIntentId,
      isFeatured: finalFeatured,
      isBoosted: finalBoosted,
      isDraft: false,
      requirements,
      duties,
      language,
    });
  }

  revalidatePath("/dashboard/parent");
  revalidatePath("/jobs");
}

export async function updateJobRecord(jobId: string, data: any) {
  const user = await requireUser();
  
  // Rate limit
  const { success } = await rateLimit(`updateJob:${user.uid}`, "strict");
  if (!success) throw new Error("Too many requests.");

  const { description, duties, requirements, language, title, location, duration, minRate, maxRate, startDate } = data;

  await db.update(jobs).set({
    description: description || undefined,
    duties: duties || undefined,
    requirements: requirements || undefined,
    language: language || undefined,
    title: title || undefined,
    location: location || undefined,
    duration: duration || undefined,
    minRate: minRate || undefined,
    maxRate: maxRate || undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    updatedAt: new Date(),
  }).where(and(eq(jobs.id, jobId), eq(jobs.parentId, user.uid)));

  revalidatePath("/dashboard/parent");
  revalidatePath(`/dashboard/nanny/open-roles/${jobId}`);
  revalidatePath("/jobs");
}
