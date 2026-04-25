"use server";

import { requireUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { users, nannyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateNannyProfileSchema, type UpdateNannyProfileInput } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { GeoEngine } from "@/lib/geo";

export async function updateNannyProfile(data: UpdateNannyProfileInput) {
  const clerkUser = await requireUser();

  // Rate limit: 10 updates per minute
  const { success } = await rateLimit(`updateProfile:${clerkUser.uid}`);
  if (!success) throw new Error("Too many requests. Please try again later.");

  // Validate input
  const parsed = updateNannyProfileSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((e) => e.message).join(", "));
  }

  const { 
    fullName, bio, hourlyRate, weeklyRate, experienceYears, location,
    education, coreSkills, specializations, videoUrl, availability, logistics, profileImageUrl,
    hasCar, carDescription, detailedExperience, maxTravelDistance, photos, dateOfBirth
  } = parsed.data;

  let { latitude, longitude } = parsed.data;

  // 0. Resolve coordinates if missing but location is present
  if ((latitude === null || latitude === undefined) || (longitude === null || longitude === undefined)) {
    if (location) {
      const coords = await GeoEngine.geocode(location);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }
  }

  // 1. Fetch current data in parallel
  const [existingUser, existingProfile] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, clerkUser.uid) }),
    db.query.nannyProfiles.findFirst({ where: eq(nannyProfiles.id, clerkUser.uid) })
  ]);

  const isNameChanged = existingUser?.fullName !== fullName;
  let lastNameUpdateAt = existingProfile?.lastNameUpdateAt;

  if (isNameChanged && existingProfile?.lastNameUpdateAt) {
    const lastUpdate = new Date(existingProfile.lastNameUpdateAt);
    const fifteenWeeksInMs = 15 * 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastUpdate.getTime() < fifteenWeeksInMs) {
       throw new Error("Professional identity lock: You can only update your name once every 15 weeks.");
    }
  }

  // If changing name, update the timestamp
  if (isNameChanged) {
    lastNameUpdateAt = new Date();
  }

  // Perform atomic update
  try {
    await db.transaction(async (tx) => {
      // 1. Update user name (The Source of Truth for identity)
      await tx.update(users).set({ 
        fullName, 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        updatedAt: new Date() 
      }).where(eq(users.id, clerkUser.uid));

      // 2. Upsert Nanny Profile (Professional Dossier)
      await tx.insert(nannyProfiles).values({
        id: clerkUser.uid,
        bio: bio || "",
        hourlyRate: hourlyRate || "0",
        weeklyRate: weeklyRate || "0",
        experienceYears: experienceYears || 0,
        location: location || "",
        latitude: (latitude !== null && latitude !== undefined) ? latitude.toString() : null,
        longitude: (longitude !== null && longitude !== undefined) ? longitude.toString() : null,
        education: education || "",
        coreSkills: coreSkills || [],
        specializations: specializations || [],
        videoUrl: videoUrl || "",
        availability: availability || {},
        logistics: logistics || [],
        photos: photos || [],
        lastNameUpdateAt,
        hasCar: hasCar ?? false,
        carDescription: carDescription || "",
        detailedExperience: detailedExperience || "",
        maxTravelDistance: maxTravelDistance || 25,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: nannyProfiles.id,
        set: {
          bio: bio || "",
          hourlyRate: hourlyRate || "0",
          weeklyRate: weeklyRate || "0",
          experienceYears: experienceYears || 0,
          location: location || "",
          latitude: (latitude !== null && latitude !== undefined) ? latitude.toString() : null,
          longitude: (longitude !== null && longitude !== undefined) ? longitude.toString() : null,
          education: education || "",
          coreSkills: coreSkills || [],
          specializations: specializations || [],
          videoUrl: videoUrl || "",
          availability: availability || {},
          logistics: logistics || [],
          photos: photos || [],
          lastNameUpdateAt,
          hasCar: hasCar ?? false,
          carDescription: carDescription || "",
          detailedExperience: detailedExperience || "",
          maxTravelDistance: maxTravelDistance || 25,
          updatedAt: new Date(),
        }
      });
    });

    revalidatePath("/dashboard/nanny/profile");
    revalidatePath(`/nannies/${clerkUser.uid}`);
    revalidatePath("/dashboard/nanny/verification");
  } catch (error) {
    console.error("[CRITICAL] Profile Save Failure:", error);
    throw new Error("Failed to save profile. Your data is safe, please try again.");
  }
}

import { uploadToR2 } from "@/lib/r2";

export async function uploadProfilePhotos(formData: FormData) {
  const clerkUser = await requireUser();

  const photos = formData.getAll("photos") as File[];
  if (photos.length === 0) return;

  const { success } = await rateLimit(`uploadPhotos:${clerkUser.uid}`);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  for (const file of photos) {
    if (file.size > MAX_SIZE) throw new Error(`File ${file.name} is too large (max 10MB)`);
  }

  // Get existing
  const profile = await db.query.nannyProfiles.findFirst({
    where: eq(nannyProfiles.id, clerkUser.uid),
  });
  const existingPhotos = (profile?.photos as string[]) || [];

  if (existingPhotos.length + photos.length > 5) {
    throw new Error("Maximum 5 photos allowed");
  }

  const uploadedUrls: string[] = [];
  for (const file of photos) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `profiles/${clerkUser.uid}/photo_${Date.now()}_${file.name}`;
    const url = await uploadToR2(buffer, fileName, file.type);
    uploadedUrls.push(url);
  }

  await db.insert(nannyProfiles).values({
    id: clerkUser.uid,
    photos: [...existingPhotos, ...uploadedUrls],
  }).onConflictDoUpdate({
    target: nannyProfiles.id,
    set: { photos: [...existingPhotos, ...uploadedUrls] }
  });

  revalidatePath("/dashboard/nanny/profile");
  revalidatePath(`/nannies/${clerkUser.uid}`);
  return { success: true, urls: uploadedUrls };
}

export async function uploadAvatar(formData: FormData) {
  const clerkUser = await requireUser();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const { success } = await rateLimit(`uploadAvatar:${clerkUser.uid}`);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `profiles/${clerkUser.uid}/avatar_${Date.now()}_${file.name}`;
  const url = await uploadToR2(buffer, fileName, file.type);

  await db.update(users).set({
    profileImageUrl: url,
    updatedAt: new Date(),
  }).where(eq(users.id, clerkUser.uid));

  revalidatePath("/dashboard/nanny/profile");
  return { success: true, url };
}

export async function uploadVideo(formData: FormData) {
  const clerkUser = await requireUser();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const { success } = await rateLimit(`uploadVideo:${clerkUser.uid}`);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `profiles/${clerkUser.uid}/intro_video_${Date.now()}`;
  const url = await uploadToR2(buffer, fileName, file.type);

  await db.update(nannyProfiles).set({
    videoUrl: url,
    updatedAt: new Date(),
  }).where(eq(nannyProfiles.id, clerkUser.uid));

  revalidatePath("/dashboard/nanny/profile");
  return { success: true, url };
}

export async function deleteProfilePhoto(photoUrl: string) {
  const clerkUser = await requireUser();

  const profile = await db.query.nannyProfiles.findFirst({
    where: eq(nannyProfiles.id, clerkUser.uid),
  });
  const existingPhotos = (profile?.photos as string[]) || [];

  const updatedPhotos = existingPhotos.filter((p) => p !== photoUrl);

  await db.update(nannyProfiles).set({
    photos: updatedPhotos,
  }).where(eq(nannyProfiles.id, clerkUser.uid));

  revalidatePath("/dashboard/nanny/profile");
  revalidatePath(`/nannies/${clerkUser.uid}`);
}

import { adminAuth } from "@/lib/firebase-admin";

export async function deleteNannyAccount() {
  const clerkUser = await requireUser();

  const { success } = await rateLimit(`deleteAccount:${clerkUser.uid}`);
  if (!success) throw new Error("Too many requests. Please try again later.");

  try {
    // 1. Delete associated profile
    await db.delete(nannyProfiles).where(eq(nannyProfiles.id, clerkUser.uid));
    
    // 2. Delete core user record (Assuming no rigid constraints block this, else cascade needed)
    await db.delete(users).where(eq(users.id, clerkUser.uid));

    // 3. Purge from Firebase Auth
    await adminAuth.deleteUser(clerkUser.uid);
  } catch (error: any) {
    console.error("Account Deletion Failed:", error);
    throw new Error("Failed to entirely purge account data. Please contact Support.");
  }
}
