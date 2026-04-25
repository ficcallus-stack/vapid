import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { nannyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadToR2 } from "@/lib/r2";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await requireUser();
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert to buffer for R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `profiles/${clerkUser.uid}/intro_video_${Date.now()}`;
    const url = await uploadToR2(buffer, fileName, file.type);

    // Update DB
    await db.update(nannyProfiles).set({
      videoUrl: url,
      updatedAt: new Date(),
    }).where(eq(nannyProfiles.id, clerkUser.uid));

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
