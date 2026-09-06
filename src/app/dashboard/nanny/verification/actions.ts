"use server";

import { requireUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { caregiverVerifications, nannyProfiles, users, referenceSubmissions, auditLogs } from "@/db/schema";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { uploadToR2 } from "@/lib/r2";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";

export async function getVerificationData(userId?: string) {
  const finalUserId = userId || (await requireUser()).uid;

  const [data, profile] = await Promise.all([
    db.query.caregiverVerifications.findFirst({
      where: eq(caregiverVerifications.id, finalUserId),
    }),
    db.query.nannyProfiles.findFirst({
      where: eq(nannyProfiles.id, finalUserId),
    })
  ]);

  return { verification: data, profile };
}

export async function updateVerificationStep(step: number) {
  const { uid: userId } = await requireUser();

  await db
    .insert(caregiverVerifications)
    .values({ id: userId, currentStep: step })
    .onConflictDoUpdate({
      target: caregiverVerifications.id,
      set: { currentStep: step, updatedAt: new Date() },
    });

  revalidatePath("/dashboard/nanny/verification");
}

export async function uploadIdentityDocs(formData: FormData) {
  const { uid: userId } = await requireUser();

  const frontFile = formData.get("front") as File;
  const backFile = formData.get("back") as File;
  const selfieFile = formData.get("selfie") as File; // New selfie capture

  // Rate Limiting
  const { success } = await rateLimit(`uploadIdentity:${userId}`);
  if (!success) throw new Error("Too many requests. Please try again later.");

  // Size limit (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (frontFile && frontFile.size > MAX_SIZE) throw new Error("Front ID file is too large (max 10MB)");
  if (backFile && backFile.size > MAX_SIZE) throw new Error("Back ID file is too large (max 10MB)");
  if (selfieFile && selfieFile.size > MAX_SIZE) throw new Error("Selfie file is too large (max 10MB)");

  let frontUrl = "";
  let backUrl = "";
  let selfieUrl = "";

  if (frontFile && frontFile.size > 0) {
    const buffer = Buffer.from(await frontFile.arrayBuffer());
    const fileName = `verifications/${userId}/id_front_${Date.now()}`;
    frontUrl = await uploadToR2(buffer, fileName, frontFile.type);
  }

  if (backFile && backFile.size > 0) {
    const buffer = Buffer.from(await backFile.arrayBuffer());
    const fileName = `verifications/${userId}/id_back_${Date.now()}`;
    backUrl = await uploadToR2(buffer, fileName, backFile.type);
  }

  if (selfieFile && selfieFile.size > 0) {
    const buffer = Buffer.from(await selfieFile.arrayBuffer());
    const fileName = `verifications/${userId}/selfie_${Date.now()}`;
    selfieUrl = await uploadToR2(buffer, fileName, selfieFile.type);
  }

  const fullName = formData.get("fullName") as string;
  const dob = formData.get("dob") as string;
  const phoneNumber = formData.get("phoneNumber") as string;

  // Update User core identity
  await db.update(users)
    .set({ 
      fullName, 
      dateOfBirth: dob ? new Date(dob) : undefined, 
      phoneNumber,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

  await db
    .insert(caregiverVerifications)
    .values({
      id: userId,
      idFrontUrl: frontUrl,
      idBackUrl: backUrl,
      selfieUrl: selfieUrl,
      currentStep: 2,
      status: "draft",
    })
    .onConflictDoUpdate({
      target: caregiverVerifications.id,
      set: {
        idFrontUrl: frontUrl || undefined,
        idBackUrl: backUrl || undefined,
        selfieUrl: selfieUrl || undefined,
        currentStep: 2,
        status: "draft",
        updatedAt: new Date(),
      },
    });

  revalidatePath("/dashboard/nanny/verification");
}

export async function submitBackgroundAuth(ssn: string) {
  const { uid: userId } = await requireUser();

  await db
    .update(caregiverVerifications)
    .set({
      backgroundAuth: true,
      backgroundAuthTimestamp: new Date(),
      ssn, // Save the actual SSN
      currentStep: 3,
      updatedAt: new Date(),
      // Keep as draft until final audit
      status: "draft", 
      adminNotes: `Full SSN provided. Awaiting dossier completion.`,
    })
    .where(eq(caregiverVerifications.id, userId));

  revalidatePath("/dashboard/nanny/verification");
}

export async function saveProfessionalProfile(data: {
  bio: string;
  experienceYears: number;
  education: string;
  specializations: string[];
  certifications: string[];
  certifications_details?: any;
}) {
  const { uid: userId } = await requireUser();

  await db
    .insert(nannyProfiles)
    .values({
      id: userId,
      bio: data.bio,
      experienceYears: data.experienceYears,
      education: data.education,
      specializations: data.specializations,
      certifications: data.certifications,
    })
    .onConflictDoUpdate({
      target: nannyProfiles.id,
      set: {
        bio: data.bio,
        experienceYears: data.experienceYears,
        education: data.education,
        specializations: data.specializations,
        certifications: data.certifications,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/dashboard/nanny/verification");
}

export async function submitReferences(referencesJson: string) {
  const clerkUser = await requireUser();
  const userId = clerkUser.uid;
  const refs = JSON.parse(referencesJson);

  // 1. Update the verification status
  await db
    .update(caregiverVerifications)
    .set({
      references: refs,
      currentStep: 4, // Move to Audit step
      updatedAt: new Date(),
    })
    .where(eq(caregiverVerifications.id, userId));

  // 2. TRUST-AUTO: Process each reference and send emails
  const { sendReferenceRequestEmail } = await import("@/lib/email");
  const userRecord = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!userRecord) throw new Error("User profile not found.");

  for (const ref of refs) {
    if (!ref.email || !ref.name) continue;

    const token = randomUUID();
    
    await db.insert(referenceSubmissions).values({
      caregiverId: userId,
      employerEmail: ref.email,
      employerName: ref.name,
      token,
      status: "pending",
      emailStatus: "pending",
      lastEmailSentAt: new Date(),
    });

    // Send the email and update status
    sendReferenceRequestEmail(
      ref.email,
      ref.name,
      userRecord.fullName || "A KindredCare Applicant",
      token
    ).then(async (result) => {
      await db.update(referenceSubmissions)
        .set({ 
          emailStatus: result.success ? "sent" : "failed",
          lastEmailSentAt: new Date()
        })
        .where(eq(referenceSubmissions.token, token));
    }).catch(async (e) => {
      console.error(`Failed to send reference email to ${ref.email}:`, e);
      await db.update(referenceSubmissions)
        .set({ 
          emailStatus: "failed",
          lastEmailSentAt: new Date()
        })
        .where(eq(referenceSubmissions.token, token));
    });
  }

  revalidatePath("/dashboard/nanny/verification");
}


export async function finalizeVerification() {
  const { uid: userId } = await requireUser();

  await db.transaction(async (tx) => {
    const current = await tx.query.caregiverVerifications.findFirst({
      where: eq(caregiverVerifications.id, userId),
    });

    // 1. Snapshot the submission in Audit Logs
    await tx.insert(auditLogs).values({
      actorId: userId,
      action: "SUBMIT_VERIFICATION",
      entityType: "caregiver_verification",
      entityId: userId,
      metadata: current || {},
      createdAt: new Date(),
    });

    // 2. Official Status Update
    await tx
      .update(caregiverVerifications)
      .set({
        status: "pending",
        currentStep: 5, 
        updatedAt: new Date(),
      })
      .where(eq(caregiverVerifications.id, userId));
  });

  revalidatePath("/dashboard/nanny/verification");
}

export async function revokeVerification() {
  const { uid: userId } = await requireUser();

  await db.transaction(async (tx) => {
    const current = await tx.query.caregiverVerifications.findFirst({
      where: eq(caregiverVerifications.id, userId),
    });

    // 1. Snapshot the REVOCATION (and the data that was pulled back)
    await tx.insert(auditLogs).values({
      actorId: userId,
      action: "REVOKE_VERIFICATION",
      entityType: "caregiver_verification",
      entityId: userId,
      metadata: current || {},
      createdAt: new Date(),
    });

    // 2. Revert to draft
    await tx
      .update(caregiverVerifications)
      .set({
        status: "draft",
        currentStep: 1,
        updatedAt: new Date(),
      })
      .where(eq(caregiverVerifications.id, userId));
  });

  revalidatePath("/dashboard/nanny/verification");
}
