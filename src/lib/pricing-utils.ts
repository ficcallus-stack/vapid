export const INSTANT_SURCHARGE_RATE = 0.20; // 20% premium for instant bookings

export function calculateInstantRate(baseRate: string | number): number {
  const rate = typeof baseRate === "string" ? parseFloat(baseRate) : baseRate;
  return Math.round(rate * (1 + INSTANT_SURCHARGE_RATE));
}

export function isInstantBooking(startDate: string, startTime: string): boolean {
  try {
    const bookingTime = new Date(`${startDate}T${startTime}`);
    const now = new Date();
    const fourHoursInMs = 4 * 60 * 60 * 1000;
    
    // If booking starts within 4 hours from now
    return (bookingTime.getTime() - now.getTime()) < fourHoursInMs && (bookingTime.getTime() - now.getTime()) > 0;
  } catch (e) {
    return false;
  }
}
