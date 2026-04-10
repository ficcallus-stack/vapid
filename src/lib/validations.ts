import { z } from "zod";

// ── Job Creation ───────────────────────────────────────────
export const createJobSchema = z.object({
  location: z.string().min(1, "Location is required").max(200),
  duration: z.string().min(1, "Duration is required").max(100),
  childCount: z.coerce.number().int().min(1).max(20),
  selectedChildrenIds: z.array(z.string()).default([]),
  startDate: z.string().optional(), // ISO string from date picker
  isFastTrack: z.boolean().default(false),
  minRate: z.coerce.number().min(1).max(500),
  maxRate: z.coerce.number().min(1).max(500),
  certs: z.record(z.string(), z.boolean()).default({}),
  duties: z.string().max(5000).optional(),
  requirements: z.record(z.string(), z.boolean()).default({}),
  language: z.string().min(1, "Language is required").max(100).default("English"),
  description: z.string().max(5000).optional(),
  scheduleType: z.enum(["recurring", "one_time"]).default("recurring"),
  schedule: z.record(z.string(), z.boolean()).optional(),
  specificDates: z.array(z.string()).optional(),
  stripePaymentIntentId: z.string().min(1, "Payment verification is required"),
  isFeatured: z.boolean().default(false),
  isBoosted: z.boolean().default(false),
  hiringType: z.enum(["hourly", "retainer"]).default("hourly"),
  retainerBudget: z.coerce.number().min(0).optional(),
  philosophy: z.string().max(5000).optional(),
}).passthrough().refine((data) => data.maxRate >= data.minRate, {
  message: "Max rate must be greater than or equal to min rate",
  path: ["maxRate"],
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

// ── Nanny Profile Update ───────────────────────────────────
export const updateNannyProfileSchema = z.object({
  fullName: z.string()
    .min(1, "Name is required")
    .max(200)
    .refine(val => val.trim().split(/\s+/).length >= 2, {
      message: "Please providing at least two names (First and Last)."
    }),
  bio: z.string().max(2000).optional(),
  hourlyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate format").optional(),
  weeklyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate format").optional(),
  experienceYears: z.coerce.number().int().min(0).max(100, "Experience cannot exceed 100 years.").optional(),
  location: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  education: z.string().max(1000).optional(),
  coreSkills: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  videoUrl: z.string().url("Invalid Video URL profile format").or(z.literal("")).optional(),
  profileImageUrl: z.string().url("Invalid Profile Photo URL format").or(z.literal("")).optional(),
  availability: z.record(z.string(), z.any()).optional(),
  logistics: z.array(z.string()).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
  // Overhaul fields
  hasCar: z.boolean().optional(),
  carDescription: z.string().max(500).optional(),
  detailedExperience: z.string().max(5000).optional(),
  maxTravelDistance: z.coerce.number().int().min(0).max(100, "Travel radius cannot exceed 100 miles.").optional(),
});

export type UpdateNannyProfileInput = z.infer<typeof updateNannyProfileSchema>;

// ── Job Application ────────────────────────────────────────
export const submitApplicationSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;

// ── Child Profile ──────────────────────────────────────────
export const createChildSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  age: z.coerce.number().int().min(0).max(18),
  type: z.string().min(1).max(50),
  bio: z.string().max(1000).optional(),
  photoUrl: z.string().url("Must be valid URL").optional().or(z.literal("")),
  specialNeeds: z.array(z.string().max(100)).max(10).default([]),
  interests: z.array(z.string().max(100)).max(20).default([]),
  medicalNotes: z.string().max(2000).optional(),
});

export type CreateChildInput = z.infer<typeof createChildSchema>;

export const updateChildSchema = createChildSchema.extend({
  id: z.string().uuid(),
});

// ── Booking ────────────────────────────────────────────────
export const createBookingSchema = z.object({
  caregiverId: z.string().min(1, "Caregiver is required"),
  jobId: z.string().uuid().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  hoursPerDay: z.coerce.number().min(1).max(24),
  totalAmount: z.coerce.number().min(0),
  hiringMode: z.enum(["hourly", "retainer"]).default("hourly"),
  notes: z.string().max(2000).optional(),
  isTrial: z.boolean().default(false),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ── Messaging ──────────────────────────────────────────────
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, "Message cannot be empty").max(5000),
  imageUrl: z.string().url("Must be a valid URL").optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const createConversationSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

// ── Reviews ────────────────────────────────────────────────
export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  revieweeId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters").max(2000),
  images: z.array(z.string().url("Must be valid URL")).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const replyToReviewSchema = z.object({
  reviewId: z.string().uuid(),
  replyText: z.string().min(5, "Reply must be at least 5 characters").max(2000),
});

export type ReplyToReviewInput = z.infer<typeof replyToReviewSchema>;

// ── Certification Enrollment ───────────────────────────────
export const enrollCertificationSchema = z.object({
  type: z.enum(["registration", "elite_bundle", "standards_program", "standards_retake"]),
});

export type EnrollCertificationInput = z.infer<typeof enrollCertificationSchema>;

export const uploadExamSchema = z.object({
  certificationType: z.enum(["registration", "elite_bundle", "standards_program", "standards_retake"]),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  passPercentage: z.coerce.number().int().min(1).max(100).default(75),
  timeLimit: z.coerce.number().int().min(1).max(300).default(60),
  price: z.coerce.number().int().min(0).default(4500),
  retakePrice: z.coerce.number().int().min(0).default(500),
  questions: z.array(z.object({
    text: z.string().min(1),
    marks: z.coerce.number().int().min(1),
    page: z.coerce.number().int().min(1),
    order: z.coerce.number().int().min(1),
  })).min(1),
});

export type UploadExamInput = z.infer<typeof uploadExamSchema>;
