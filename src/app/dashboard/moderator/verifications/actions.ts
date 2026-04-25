"use server";

import { requireUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { caregiverVerifications, users, auditLogs, notifications, nannyProfiles } from "@/db/schema";
import { eq, and, desc, asc, sql, count, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getVerificationStats() {
  await requireModerator();
  
  const stats = await db
    .select({
      status: caregiverVerifications.status,
      count: count(),
    })
    .from(caregiverVerifications)
    .groupBy(caregiverVerifications.status);

  const result = {
    pending: 0,
    verified: 0,
    rejected: 0,
    total: 0
  };

  stats.forEach(s => {
    if (s.status === 'pending') result.pending = s.count;
    if (s.status === 'verified') result.verified = s.count;
    if (s.status === 'rejected') result.rejected = s.count;
    result.total += s.count;
  });

  return result;
}

export async function getVerificationsList(params: {
  status: "pending" | "verified" | "rejected";
  sort: "recent" | "earliest";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  await requireModerator();
  
  const { status, sort, search, limit = 20, offset = 0 } = params;
  
  const whereClause = search 
    ? and(
        eq(caregiverVerifications.status, status),
        or(
          ilike(users.fullName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      )
    : eq(caregiverVerifications.status, status);

  const query = db
    .select({
      id: caregiverVerifications.id,
      status: caregiverVerifications.status,
      updatedAt: caregiverVerifications.updatedAt,
      userName: users.fullName,
      userEmail: users.email,
      moderatorName: sql<string>`(SELECT full_name FROM users WHERE id = ${caregiverVerifications.moderatorId})`,
    })
    .from(caregiverVerifications)
    .innerJoin(users, eq(caregiverVerifications.id, users.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  if (sort === "recent") {
    query.orderBy(desc(caregiverVerifications.updatedAt));
  } else {
    query.orderBy(asc(caregiverVerifications.updatedAt));
  }

  return await query;
}

export async function getVerificationDetail(id: string) {
  await requireModerator();
  
  const data = await db.query.caregiverVerifications.findFirst({
    where: eq(caregiverVerifications.id, id),
    with: {
      user: true,
      submissions: true,
    }
  });

  return data;
}

export async function processVerification(id: string, action: "verify" | "reject", notes?: string) {
  const mod = await requireModerator();
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, id)
  });

  if (!user) throw new Error("User not found.");

  await db.transaction(async (tx) => {
    // 1. Update verification record
    await tx
      .update(caregiverVerifications)
      .set({
        status: action === "verify" ? "verified" : "rejected",
        adminNotes: notes,
        moderatorId: mod.uid,
        updatedAt: new Date(),
      })
      .where(eq(caregiverVerifications.id, id));

    // 1.5 Sync verified status to nanny profile
    await tx
      .update(nannyProfiles)
      .set({
        isVerified: action === "verify",
      })
      .where(eq(nannyProfiles.id, id));

    // 2. In-app Notification
    await tx.insert(notifications).values({
      userId: id,
      type: "verification",
      title: action === "verify" ? "Identity Verified ✅" : "Action Required ⚠️",
      message: action === "verify" 
        ? "Your professional dossier has been approved. You are now a verified caregiver!" 
        : `Your verification requires updates. Moderator notes: "${notes}"`,
      linkUrl: "/dashboard/nanny/verification",
    });

    // 3. Audit log
    await tx.insert(auditLogs).values({
      actorId: mod.uid,
      action: action === "verify" ? "VERIFY_NANNY" : "REJECT_NANNY",
      entityType: "caregiver_verification",
      entityId: id,
      metadata: { notes },
    });
  });

  // 4. Send Email (Async, non-blocking)
  const { sendVerificationStatusEmail } = await import("@/lib/email");
  sendVerificationStatusEmail(user.email!, user.fullName!, action === "verify" ? "verified" : "rejected", notes).catch(e => console.error("Failed to send verification email:", e));

  revalidatePath("/dashboard/moderator/verifications");
  revalidatePath(`/dashboard/moderator/verifications/${id}`);
}

async function requireModerator() {
  const user = await requireUser();
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.uid)
  });
  
  if (dbUser?.role !== "moderator" && dbUser?.role !== "admin") {
    throw new Error("Unauthorized: Moderator access required.");
  }
  
  return user;
}
