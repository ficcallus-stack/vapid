"use server";

import { requireUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { parentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GeoEngine } from "@/lib/geo";

import { updateParentProfileSchema, type UpdateParentProfileInput } from "@/lib/validations";
import { uploadToR2 } from "@/lib/r2";
import { children } from "@/db/schema";

export async function getParentProfile() {
  const user = await requireUser();
  
  const profile = await db.query.parentProfiles.findFirst({
    where: eq(parentProfiles.id, user.uid),
  });

  return profile || null;
}

export async function updateParentProfile(data: UpdateParentProfileInput) {
  const user = await requireUser();
  const parsed = updateParentProfileSchema.parse(data);
  let { latitude, longitude } = parsed;

  // Resolve coordinates from location string if missing
  if ((!latitude || !longitude) && parsed.location) {
    const coords = await GeoEngine.geocode(parsed.location);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
    }
  }

  const existing = await db.query.parentProfiles.findFirst({
    where: eq(parentProfiles.id, user.uid),
  });

  const values = {
    ...parsed,
    latitude: latitude?.toString(),
    longitude: longitude?.toString(),
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(parentProfiles)
      .set(values)
      .where(eq(parentProfiles.id, user.uid));
  } else {
    await db.insert(parentProfiles).values({
      id: user.uid,
      ...values,
    });
  }

  revalidatePath("/dashboard/parent/settings");
  revalidatePath("/dashboard/parent");
  return { success: true };
}

export async function generateFamilyIllustration() {
  const user = await requireUser();
  const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!API_KEY) throw new Error("AI Studio Key is missing from configuration.");

  // 1. Gather descriptive context
  const profile = await db.query.parentProfiles.findFirst({
    where: eq(parentProfiles.id, user.uid),
  });
  
  const kids = await db.query.children.findMany({
    where: eq(children.parentId, user.uid),
  });

  if (!profile?.parentDescription || !profile?.partnerDescription) {
    throw new Error("Missing parent or partner description for AI generation.");
  }

  const kidsDescriptions = kids.map(k => `${k.name} (${k.age}yr old ${k.type}): ${k.bio || "Happy child"}`).join(". ");
  
  // 2. Prompt Synthesis
  const prompt = `A candid, high-end, warm portrait of a happy family outdoors in a sun-drenched meadow at golden hour. 
  The father/partner is described as: ${profile.parentDescription}. 
  The mother/partner is described as: ${profile.partnerDescription}. 
  The children are: ${kidsDescriptions}. 
  Style: Realistic but artistic high-fidelity illustration, soft minimalist lighting, premium brand aesthetic. 
  Focus: Joyful, connected, and authentic family moment.`;

  // 3. Imagen 4 Call
  const MODEL = "imagen-3.0-generate-001"; // Falling back to 3.0 if 4.0 ultra is restricted, 
  // though list showed imagen-4.0-generate-001, 3.0 is more stable for general API access
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateImages?key=${API_KEY}`;

  const response = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Imagen API Error:", errorText);
    throw new Error("Failed to reach AI Studio. Please check your descriptions and try again.");
  }

  const result = await response.json();
  const base64Data = result.images?.[0]?.base64EncodedData;

  if (!base64Data) throw new Error("AI failed to generate an image. Your descriptions might be too complex or restricted.");

  // 4. Persistence (Upload to R2)
  const buffer = Buffer.from(base64Data, 'base64');
  const fileName = `family-hub/${user.uid}/ai-portrait-${Date.now()}.png`;
  
  await uploadToR2(buffer, fileName, "image/png");
  const r2Url = `${process.env.R2_PUBLIC_URL}/${fileName}`;

  // 5. Update Profile
  await db.update(parentProfiles).set({
    familyPhoto: r2Url,
    updatedAt: new Date(),
  }).where(eq(parentProfiles.id, user.uid));

  revalidatePath("/dashboard/parent/settings");
  revalidatePath("/dashboard/parent");
  
  return { url: r2Url };
}
