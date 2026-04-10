"use server";

import { db } from "@/db";
import { jobs, parentProfiles, users, children, applications, nannyProfiles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireUser } from "@/lib/get-server-user";
import { revalidatePath } from "next/cache";

export interface FilterOptions {
  jobType?: string;
  minRate?: number;
  maxRate?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  limit?: number;
  offset?: number;
}

/**
 * Fetch open jobs with advanced filtering, proximity search, and pagination.
 */
export async function getOpenJobs(options: FilterOptions = {}) {
  const { 
    jobType, 
    minRate, 
    maxRate, 
    latitude, 
    longitude, 
    radius = 25, 
    limit = 10, 
    offset = 0 
  } = options;

  // Base query with relations
  let query = db.query.jobs.findMany({
    where: (jobs, { and, eq, gte, lte }) => {
        const filters = [eq(jobs.status, "open")];
        if (jobType && jobType !== 'all') filters.push(eq(jobs.scheduleType, jobType));
        if (minRate) filters.push(gte(jobs.minRate, minRate));
        if (maxRate) filters.push(lte(jobs.maxRate, maxRate));
        return and(...filters);
    },
    orderBy: [desc(jobs.createdAt)],
    limit: limit,
    offset: offset,
    with: {
      parent: {
        with: {
          parentProfile: true,
          children: true,
        }
      }
    }
  });

  const openJobs = await query;

  // Map to flat structure for UI
  const mappedJobs = openJobs.map(job => ({
    id: job.id,
    title: job.title,
    description: job.description,
    scheduleType: job.scheduleType,
    schedule: job.schedule as Record<string, boolean>,
    minRate: job.minRate,
    maxRate: job.maxRate,
    retainerBudget: job.retainerBudget,
    createdAt: job.createdAt,
    parentName: (job.parent as any).parentProfile?.familyName,
    parentPhoto: (job.parent as any).parentProfile?.familyPhoto,
    location: (job.parent as any).parentProfile?.location,
    latitude: (job.parent as any).parentProfile?.latitude,
    longitude: (job.parent as any).parentProfile?.longitude,
    children: (job.parent as any).children,
  }));

  // Proximity Filter (Application Level for now, or we can use SQL for better perf if radius is active)
  if (latitude && longitude && radius) {
    return mappedJobs.filter(job => {
        if (!job.latitude || !job.longitude) return false;
        
        // Haversine formula in JS for filtering the result set
        const R = 3958.8; // Earth radius in miles
        const dLat = (Number(job.latitude) - latitude) * Math.PI / 180;
        const dLon = (Number(job.longitude) - longitude) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(Number(job.latitude) * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance <= radius;
    });
  }

  return mappedJobs;
}

/**
 * Fetch detailed information for a specific job.
 */
export async function getJobDetail(jobId: string) {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
    with: {
      parent: {
        with: {
          parentProfile: true,
          children: true,
        }
      }
    }
  });

  if (!job) return null;

  // Flatten the response for easier UI usage
  const allChildren = (job.parent as any).children || [];
  const selectedIds = job.selectedChildIds || [];
  
  // Only show children that were specifically selected for this job,
  // or show all children if no specific selection was persisted.
  const jobChildren = selectedIds.length > 0 
    ? allChildren.filter((c: any) => selectedIds.includes(c.id))
    : allChildren;

  return {
    ...job,
    parentInfo: job.parent,
    profile: (job.parent as any).parentProfile,
    children: jobChildren,
  };
}

/**
 * Apply to a job. Ensures the nanny is verified OR has an active subscription.
 */
export async function applyToJob(jobId: string, message?: string) {
  const user = await requireUser();
  
  // 1. Fetch full user record to check premium status
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.uid)
  });

  // 2. Check if nanny is verified OR has an active premium status
  const profile = await db.query.nannyProfiles.findFirst({
    where: eq(nannyProfiles.id, user.uid)
  });

  const isSubscribed = userRecord?.isPremium || userRecord?.subscriptionStatus === "active";
  const isVerified = profile?.isVerified || false;

  if (!isVerified && !isSubscribed) {
    throw new Error("You must be a verified caregiver or a premium subscriber to apply for jobs. Please complete your registration or upgrade your account.");
  }

  // 3. Check for duplicate application
  const existing = await db.query.applications.findFirst({
    where: and(
      eq(applications.jobId, jobId),
      eq(applications.caregiverId, user.uid)
    )
  });

  if (existing) {
    throw new Error("You have already applied for this position.");
  }

  // 4. Create application
  const [newApp] = await db.insert(applications).values({
    jobId,
    caregiverId: user.uid,
    message,
    status: "pending",
  }).returning();

  revalidatePath(`/dashboard/nanny/open-roles/${jobId}`);
  revalidatePath("/dashboard/nanny");
  
  return { success: true, applicationId: newApp.id };
}

/**
 * Cancel/Withdraw an application.
 */
export async function cancelApplication(applicationId: string) {
    const user = await requireUser();
    
    // Ensure the application belongs to the user
    const app = await db.query.applications.findFirst({
        where: and(
            eq(applications.id, applicationId),
            eq(applications.caregiverId, user.uid)
        )
    });

    if (!app) {
        throw new Error("Application not found or unauthorized.");
    }

    await db.delete(applications).where(eq(applications.id, applicationId));

    revalidatePath(`/dashboard/nanny/open-roles/${app.jobId}`);
    revalidatePath("/dashboard/nanny");
    revalidatePath("/dashboard/nanny/applications");

    return { success: true };
}

/**
 * Fetch application details for the status page.
 */
export async function getApplicationStatus(applicationId: string) {
  const app = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
    with: {
      job: {
        with: {
          parent: {
            with: {
              parentProfile: true,
              children: true
            }
          }
        }
      }
    }
  });

  if (!app) return null;

  return {
    ...app,
    job: app.job,
    parent: (app.job as any).parent,
    profile: (app.job as any).parent.parentProfile,
    children: (app.job as any).parent.children,
  };
}
