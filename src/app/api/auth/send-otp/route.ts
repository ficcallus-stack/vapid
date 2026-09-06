import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { emailOtps, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendOTPEmail } from "@/lib/email";
import { randomInt } from "crypto";

// POST — Generate and send OTP
export async function POST(request: NextRequest) {
  try {
    const serverUser = await getServerUser();
    if (!serverUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = serverUser.email;
    if (!email) {
      return NextResponse.json({ error: "No email associated with account" }, { status: 400 });
    }

    // Rate limit: max 3 OTPs per email in 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const sixtySecAgo = new Date(Date.now() - 60 * 1000);

    const recentOtps = await db.query.emailOtps.findMany({
      where: and(
        eq(emailOtps.email, email),
        gt(emailOtps.createdAt, fifteenMinAgo)
      ),
      orderBy: (otps, { desc }) => [desc(otps.createdAt)],
    });

    // Hard 60s lockout for deduplication
    const lastOtp = recentOtps[0];
    if (lastOtp && lastOtp.createdAt > sixtySecAgo) {
        return NextResponse.json(
            { error: "Please wait 60 seconds before requesting another code." },
            { status: 429 }
        );
    }

    if (recentOtps.length >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait a few minutes." },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    await db.insert(emailOtps).values({
      email,
      code,
      expiresAt,
    });

    // Get user name for email
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, serverUser.uid),
    });

    // Send via ZeptoMail
    await sendOTPEmail(email, dbUser?.fullName || "there", code);

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
