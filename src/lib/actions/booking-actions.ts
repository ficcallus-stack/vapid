"use server";

import { requireUser } from "@/lib/get-server-user";
import { db } from "@/db";
import { bookings, nannyProfiles, users } from "@/db/schema";
import { eq as eqOp } from "drizzle-orm";
import { eq, and, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { createBookingSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { PaymentService } from "@/lib/payments/service";
import { isInstantBooking, calculateInstantRate } from "@/lib/pricing-utils";

/**
 * Step 1 Action: Creates a draft booking to persist schedule refinement.
 */
export async function initBookingAction(data: {
  caregiverId: string;
  startDate: string;
  endDate: string;
  hiringMode: "hourly" | "retainer";
  refinedSchedule: any;
  childCount: number;
  selectedChildIds: string[];
  notes?: string;
  locationDescription: string;
  startTime?: string;
  // Safety Data
  phoneNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}) {
  const user = await requireUser();

  // Sync user profile with safety data if provided
  if (data.phoneNumber || data.emergencyContactName || data.emergencyContactPhone) {
    await db.update(users).set({
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      ...(data.emergencyContactName && { emergencyContactName: data.emergencyContactName }),
      ...(data.emergencyContactPhone && { emergencyContactPhone: data.emergencyContactPhone }),
    }).where(eq(users.id, user.uid));
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (data.startTime) {
    const [h, m] = data.startTime.split(":").map(Number);
    start.setHours(h, m, 0, 0);
    // If it's ad-hoc (same day), set end time based on hours selected or just default to 4h from start?
    // Actually, pulse grid gives us total hours.
  }
  
  // Fetch caregiver's professional rates
  const caregiverProfile = await db.query.nannyProfiles.findFirst({
    where: eqOp(nannyProfiles.id, data.caregiverId),
  });

  if (!caregiverProfile) throw new Error("Caregiver profile not found.");

  const hourlyRate = parseFloat(caregiverProfile.hourlyRate || "35");
  const weeklyRate = parseFloat(caregiverProfile.weeklyRate || (hourlyRate * 40 * 0.85).toString());
  const EXTRA_CHILD_HOURLY = 5;
  const EXTRA_CHILD_WEEKLY = 150;

  let subtotalCents = 0;
  let totalHours = 0;

  // 1. Validate Child Count consistency
  const activeChildCount = Math.max(data.childCount, data.selectedChildIds.length);
  const extraChildren = Math.max(0, activeChildCount - 1);
  const isInstant = isInstantBooking(data.startDate, data.startTime || "");

  if (data.hiringMode === "retainer") {
    // Instant Premium Logic for Retainer
    const effectiveWeeklyRate = isInstant ? calculateInstantRate(weeklyRate) : weeklyRate;

    const baseWeekly = effectiveWeeklyRate * 100;
    const extraWeekly = extraChildren * EXTRA_CHILD_WEEKLY * 100;
    subtotalCents = baseWeekly + extraWeekly;
    totalHours = 40;
  } else {
    // Hourly calculation based on 4-hour Pulse Grid chunks
    const selectedSlots = Object.values(data.refinedSchedule || {}).filter(Boolean);
    
    // VULN-01 FIX: Never trust client to provide 0 slots for a valid booking window
    if (selectedSlots.length === 0) {
      throw new Error("Invalid schedule: No time slots selected for hourly booking.");
    }

    totalHours = selectedSlots.length * 4; 
    
    // Instant Premium Logic
    const effectiveHourlyRate = isInstant ? calculateInstantRate(hourlyRate) : hourlyRate;

    const baseHourly = Math.round(totalHours * effectiveHourlyRate * 100);
    const extraHourly = Math.round(totalHours * extraChildren * EXTRA_CHILD_HOURLY * 100);
    subtotalCents = baseHourly + extraHourly;
  }

  // Calculate 7.5% Total Fee (2.9% Stripe + 4.6% Kindred)
  const totalFeeCents = Math.round(subtotalCents * 0.075);
  const estimatedTotalCents = subtotalCents + totalFeeCents;

  const [newBooking] = await db.insert(bookings).values({
    parentId: user.uid,
    caregiverId: data.caregiverId,
    startDate: start,
    endDate: end,
    hoursPerDay: Math.max(1, Math.round(totalHours / 7)),
    totalAmount: estimatedTotalCents, 
    hiringMode: data.hiringMode,
    refinedSchedule: data.refinedSchedule,
    childCount: activeChildCount, // Use validated count
    selectedChildIds: data.selectedChildIds,
    notes: data.notes,
    locationDescription: data.locationDescription,
    phoneNumber: data.phoneNumber,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    isInstant,
    status: "pending",
  }).returning();

  return { bookingId: newBooking.id };
}

/**
 * Step 2 Action: Creates the final Stripe session.
 */
export async function createFinalPaymentSession(data: {
  bookingId: string;
}) {
  const serverUser = await requireUser();
  const [user] = await db.select().from(users).where(eq(users.id, serverUser.uid)).limit(1);
  if (!user) throw new Error("User record not found.");
  
  const origin = (await headers()).get("origin");

  // VULN-05: Add ownership check
  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, data.bookingId), eq(bookings.parentId, serverUser.uid)),
    with: {
      caregiver: true,
      caregiverProfile: true
    }
  });

  if (!booking) throw new Error("Booking not found or access denied.");

  // 2. Ensure Stripe Customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.fullName || undefined,
      metadata: { userId: user.id }
    });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
  }

  // 3. Use the precisely calculated amount from Step 1
  // booking.totalAmount already includes the 7.5% total markup
  const fullAmountCents = booking.totalAmount;
  const subtotalCents = Math.round(fullAmountCents / 1.075);
  const kindredFeeCents = Math.round(subtotalCents * 0.046);
  
  const isRetainer = booking.hiringMode === "retainer";
  const diffDays = Math.max(1, Math.ceil(Math.abs(booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  const caregiver = booking.caregiver as any;

  // 4. Create Session via Centralized Service
  const session = await PaymentService.createCheckoutSessionSafely({
    customerId,
    amount: fullAmountCents,
    name: `Care with ${caregiver.fullName}`,
    description: `${diffDays} days for Booking #${booking.id.slice(0,8)} | ${booking.childCount} children`,
    successUrl: `${origin}/booking/success?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/nannies/${booking.caregiverId}/book/schedule`,
    metadata: { bookingId: booking.id },
    idempotencyKey: `booking_escrow_${booking.id}` 
  });

  return { url: session.url };
}

/**
 * Step 2 Action (Embedded): Creates a Payment Intent for the booking.
 */
export async function createBookingPaymentIntentAction(data: {
  bookingId: string;
}) {
  const serverUser = await requireUser();
  const [user] = await db.select().from(users).where(eq(users.id, serverUser.uid)).limit(1);
  if (!user) throw new Error("User record not found.");

  // 1. Fetch Booking
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, data.bookingId),
    with: {
      caregiver: true,
      caregiverProfile: true
    }
  });

  if (!booking) throw new Error("Booking not found.");

  // 2. Ensure Stripe Customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.fullName || undefined,
      metadata: { userId: user.id }
    });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
  }

  // 3. Create Intent via Centralized Service
  // booking.totalAmount already includes the 7.5% total markup
  const result = await PaymentService.createIntentSafely({
    amount: booking.totalAmount,
    userId: user.id,
    bookingId: booking.id,
    description: `Care with ${((booking as any).caregiver?.fullName) || "Nanny"} (Booking #${booking.id.slice(0,8)})`,
    metadata: {
      bookingId: booking.id,
      caregiverId: booking.caregiverId
    }
  });

  return result;
}

/**
 * Nanny Action: Accept or Reject a paid booking.
 */
export async function updateBookingStatusNanny(data: {
  bookingId: string;
  action: "accept" | "reject";
}) {
  const user = await requireUser();

  // 1. Fetch and verify ownership
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, data.bookingId),
    with: { caregiver: true }
  });

  if (!booking || booking.caregiverId !== user.uid) {
    throw new Error("Unauthorized access to this booking.");
  }

  if (data.action === "accept") {
    // A. Confirm Booking
    await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, data.bookingId));
    
    // B. Set Nanny as Occupied
    await db.update(nannyProfiles).set({ isOccupied: true }).where(eq(nannyProfiles.id, user.uid));
    
    // C. Trigger Happy Notification (Next Step: Messaging)
    // (Actual messaging logic is already in Ably if needed)
    
  } else {
    // A. Reject Booking (Cancel)
    await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, data.bookingId));
    
    // B. Trigger Automated Refund
    if (booking.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId.startsWith("cs_") ? undefined : booking.stripePaymentIntentId,
          checkout_session: booking.stripePaymentIntentId.startsWith("cs_") ? booking.stripePaymentIntentId : undefined
        } as any);
      } catch (refundErr: any) {
        console.error("Automated refund failed:", refundErr.message);
        // We still marked it cancelled, but Admin might need to manual refund
      }
    }
  }

  revalidatePath("/dashboard/nanny");
  revalidatePath(`/nannies/${user.uid}`);
  return { success: true };
}

/**
 * Public Action: Checks if a nanny has clashes.
 */
export async function checkNannyAvailabilityAction(data: {
  nannyId: string;
  startDate: string;
  startTime: string;
  hiringMode: "hourly" | "retainer";
  pulseGrid: any;
}) {
  const { checkNannyClashes } = await import("@/lib/availability-logic");
  
  const start = new Date(data.startDate);
  const [h, m] = data.startTime.split(":").map(Number);
  start.setHours(h, m, 0, 0);

  // Estimate duration based on hiring mode
  let durationMinutes = 240; // Default 4 hours
  if (data.hiringMode === "hourly") {
    const chunks = Object.values(data.pulseGrid || {}).filter(Boolean).length;
    durationMinutes = chunks * 240;
  } else {
    durationMinutes = 480; // Default 8 hours for retainer start
  }

  const end = new Date(start.getTime() + durationMinutes * 60000);
  
  return await checkNannyClashes(data.nannyId, start, end);
}

/**
 * Nanny Action: Clock-in to a shift.
 */
export async function clockInAction(bookingId: string) {
    const user = await requireUser();
    
    // 1. Fetch booking to check time guard
    const bookingRecord = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, bookingId), eq(bookings.caregiverId, user.uid))
    });

    if (!bookingRecord) throw new Error("Booking not found.");

    // 10 minute grace period
    const now = new Date();
    const startTime = new Date(bookingRecord.startDate);
    const earlyLimit = new Date(startTime.getTime() - 10 * 60 * 1000);

    if (now < earlyLimit) {
        const diffMs = startTime.getTime() - now.getTime();
        const diffMins = Math.ceil(diffMs / 60000);
        throw new Error(`It is too early to clock in. Your shift starts in ${diffMins} minutes (10-min grace period allowed).`);
    }

    const [booking] = await db.update(bookings)
        .set({ checkInTime: now })
        .where(and(eq(bookings.id, bookingId), eq(bookings.caregiverId, user.uid)))
        .returning();

    if (!booking) throw new Error("Booking not found or unauthorized.");

    // Trigger Ably event for Parent
    // We'll use a server-side publish if possible, or expect client to publish
    // For now, let's just return success and let the client-side Presence handle it
    
    revalidatePath("/dashboard/nanny");
    revalidatePath("/dashboard/parent");
    return { success: true, checkInTime: booking.checkInTime };
}

/**
 * Nanny Action: Clock-out from a shift.
 */
export async function clockOutAction(bookingId: string) {
    const user = await requireUser();
    
    const [booking] = await db.update(bookings)
        .set({ checkOutTime: new Date() })
        .where(and(eq(bookings.id, bookingId), eq(bookings.caregiverId, user.uid)))
        .returning();

    if (!booking) throw new Error("Booking not found or unauthorized.");

    // Stage 3 logic: Automated Overtime calculation
    const { processBookingOvertime, clearFundsForBooking } = await import("@/lib/financial-logic");
    await processBookingOvertime(bookingId);
    await clearFundsForBooking(bookingId);

    revalidatePath("/dashboard/nanny");
    revalidatePath("/dashboard/parent");
    return { success: true, checkOutTime: booking.checkOutTime };
}

/**
 * OPS-01: Automated No-Show Detection.
 * Scans for bookings that should have started by now but have no clock-in.
 * Returns a list of 'danger' bookings for parent/admin monitoring.
 */
export async function monitorNoShowsAction() {
    const { uid: userId } = await requireUser();
    
    // Find bookings that started more than 30 mins ago but have no check-in
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60000);
    
    const dangerBookings = await db.query.bookings.findMany({
        where: and(
            eq(bookings.status, "confirmed"),
            sql`${bookings.checkInTime} IS NULL`,
            sql`${bookings.startDate} <= ${thirtyMinsAgo}`
        ),
        with: {
            caregiver: true
        }
    });

    if (dangerBookings.length > 0) {
        console.warn(`[Safety Engine] Detected ${dangerBookings.length} potential no-shows.`);
        // Note: In a real production environment, this would trigger a background 
        // SMS/Push notification to the Parent via Twilio/SNS.
    }

    return dangerBookings;
}
