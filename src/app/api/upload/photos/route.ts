import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { nannyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadToR2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await requireUser();
    const formData = await req.formData();
    const photos = formData.getAll("photos") as File[];

    if (photos.length === 0) {
      return NextResponse.json({ error: "No photos provided" }, { status: 400 });
    }

    // Get existing to check limit
    const profile = await db.query.nannyProfiles.findFirst({
      where: eq(nannyProfiles.id, clerkUser.uid),
    });
    const existingPhotos = (profile?.photos as string[]) || [];

    if (existingPhotos.length + photos.length > 5) {
      return NextResponse.json({ error: "Maximum 5 photos allowed" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    for (const file of photos) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `profiles/${clerkUser.uid}/photo_${Date.now()}_${file.name}`;
      const url = await uploadToR2(buffer, fileName, file.type);
      uploadedUrls.push(url);
    }

    // Update DB
    const finalPhotos = [...existingPhotos, ...uploadedUrls];
    await db.insert(nannyProfiles).values({
      id: clerkUser.uid,
      photos: finalPhotos,
    }).onConflictDoUpdate({
      target: nannyProfiles.id,
      set: { photos: finalPhotos, updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error: any) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
