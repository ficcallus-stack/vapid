"use server";

import { db } from "@/db";
import { pageVisits } from "@/db/schema";
import { headers } from "next/headers";
import crypto from "crypto";

export async function recordVisit(path: string, referrer: string) {
  try {
    const headersList = await headers();

    // In a real Vercel/Next.js environment, these headers are populated
    // We provide fallbacks for local dev
    const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
    const country = headersList.get("x-vercel-ip-country") || "US";
    const region = headersList.get("x-vercel-ip-country-region") || "CA";
    const city = headersList.get("x-vercel-ip-city") || "San Francisco";

    // Hash IP for privacy compliance
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Simple referrer cleanup
    let cleanReferrer = "Direct";
    if (referrer) {
      try {
        const url = new URL(referrer);
        cleanReferrer = url.hostname;
      } catch (e) {
        cleanReferrer = referrer;
      }
    }

    await db.insert(pageVisits).values({
      path,
      referrer: cleanReferrer,
      country,
      region,
      city,
      ipHash,
    });
  } catch (error) {
    console.error("Failed to record visit:", error);
    // Silent fail for analytics so it doesn't break user experience
  }
}
