import { pgTable, text, timestamp, boolean, decimal, integer, pgEnum, primaryKey, jsonb, foreignKey, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["parent", "caregiver", "admin", "moderator"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "closed", "completed"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "accepted", "rejected"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "paid", "confirmed", "in_progress", "completed", "cancelled", "disputed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "authorized", "captured", "refunded", "failed", "held_in_escrow", "disputed"]);
export const certificationTypeEnum = pgEnum("certification_type", ["registration", "elite_bundle", "standards_program"]);
export const certificationStatusEnum = pgEnum("certification_status", ["pending_payment", "enrolled", "in_progress", "completed", "expired"]);
export const verificationStatusEnum = pgEnum("verification_status", ["none", "draft", "pending", "verified", "rejected"]);
export const walletTransactionTypeEnum = pgEnum("wallet_transaction_type", ["earning", "withdrawal"]);
export const walletTransactionStatusEnum = pgEnum("wallet_transaction_status", ["pending", "cleared", "completed", "failed"]);
export const examStatusEnum = pgEnum("exam_status", ["started", "submitted", "marking", "passed", "failed"]);
export const referralStatusEnum = pgEnum("referral_status", ["pending", "signed_up", "reviewing", "completed", "failed"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "canceled", "incomplete", "trialing"]);


export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);
export const ticketCategoryEnum = pgEnum("ticket_category", ["general", "safety", "payment", "technical", "dispute"]);
export const supportStatusEnum = pgEnum("support_status", ["open", "closed"]);
export const platformCreditTransactionTypeEnum = pgEnum("platform_credit_transaction_type", ["earned_booking", "earned_referral", "redeemed", "revoked_refund"]);
export const chatUnlockMethodEnum = pgEnum("chat_unlock_method", ["stripe", "credits", "booking", "premium"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["none", "plus", "elite"]);

// ── Users ──────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Firebase UID
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  profileImageUrl: text("profile_image_url"),
  role: userRoleEnum("role").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  referralCode: text("referral_code").unique().$defaultFn(() => Math.random().toString(36).substring(2, 8).toUpperCase()),
  referredBy: text("referred_by"),
  referralBalance: integer("referral_balance").default(0).notNull(), // points/cents
  stripeConnectId: text("stripe_connect_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("none").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  platformCredits: integer("platform_credits").default(0).notNull(), // New: 15 per USD spent, 100 = 1 USD
  isGhost: boolean("is_ghost").default(false).notNull(), // Secret Engine Flag
  phoneNumber: text("phone_number"), // Professional Contact for post-booking
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  lastRoleSwitchedAt: timestamp("last_role_switched_at"), 
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  referredByFk: foreignKey({
    columns: [table.referredBy],
    foreignColumns: [table.id],
    name: "users_referred_by_fkey"
  }),
  roleIdx: index("users_role_idx").on(table.role),
  subscriptionIdx: index("users_subscription_idx").on(table.subscriptionTier),
}));

export const referrals = pgTable("referrals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  referrerId: text("referrer_id").notNull().references(() => users.id),
  refereeId: text("referee_id").notNull().references(() => users.id),
  status: referralStatusEnum("status").default("pending").notNull(),
  rewardAmount: integer("reward_amount").default(0).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Email OTPs ─────────────────────────────────────────────
export const emailOtps = pgTable("email_otps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Nanny Profiles ─────────────────────────────────────────
export const nannyProfiles = pgTable("nanny_profiles", {
  id: text("id").primaryKey().references(() => users.id),
  bio: text("bio"),
  experienceYears: integer("experience_years").default(0),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("0"),
  weeklyRate: decimal("weekly_rate", { precision: 10, scale: 2 }).default("0"),
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isVerified: boolean("is_verified").default(false).notNull(),
  photos: jsonb("photos").$type<string[]>().default([]),
  availability: jsonb("availability").$type<Record<string, any>>().default({}),
  terms: text("terms"),
  
  // New fields for premium design
  education: text("education"),
  responseTime: text("response_time").default("15 mins"),
  lastActive: timestamp("last_active").defaultNow(),
  activeJobsCount: integer("active_jobs_count").default(0),
  specializations: jsonb("specializations").$type<string[]>().default([]),
  logistics: jsonb("logistics").$type<string[]>().default([]),
  coreSkills: jsonb("core_skills").$type<string[]>().default([]),
  certifications: jsonb("certifications").$type<string[]>().default([]),
  videoUrl: text("video_url"),
  isOccupied: boolean("is_occupied").default(false).notNull(),
  
  // Overhaul Step 6: Security & Professional Assets
  lastNameUpdateAt: timestamp("last_name_update_at"),
  hasCar: boolean("has_car").default(false).notNull(),
  carDescription: text("car_description"),
  detailedExperience: text("detailed_experience"),

  maxTravelDistance: integer("max_travel_distance").default(25).notNull(),
  interests: jsonb("interests").$type<string[]>().default([]).notNull(), // Shared from children context
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    locationIdx: index("nanny_location_idx").on(table.location),
    isVerifiedIdx: index("nanny_verified_idx").on(table.isVerified),
}));

// ── Children ───────────────────────────────────────────────
export const children = pgTable("children", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  type: text("type").notNull(), // e.g., "toddler", "pre-schooler", "infant"
  bio: text("bio"),
  photoUrl: text("photo_url"),
  specialNeeds: jsonb("special_needs").$type<string[]>().default([]), 
  interests: jsonb("interests").$type<string[]>().default([]).notNull(), // NEW: Data-driven likings
  medicalNotes: text("medical_notes"), // NEW: Crucial health alerts
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Parent Profiles ────────────────────────────────────────
export const parentProfiles = pgTable("parent_profiles", {
  id: text("id").primaryKey().references(() => users.id),
  familyName: text("family_name"),
  familyPhoto: text("family_photo"),
  location: text("location"),
  bio: text("bio"),
  philosophy: text("philosophy"), // NEW: Family parenting style
  householdManual: text("household_manual"), 
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Care Team (Stage 1 overhaul) ───────────────────────────
export const careTeam = pgTable("care_team", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull().references(() => users.id),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  status: text("status").default("active").notNull(), // active, archived
  nickname: text("nickname"), // e.g., "Full-time Nanny", "Date-night regular"
  privateNotes: text("private_notes"), // For parents to remember things about the nanny
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Jobs ───────────────────────────────────────────────────
export const jobs = pgTable("jobs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull().references(() => users.id),
  hiringType: text("hiring_type").default("hourly").notNull(), // "hourly" | "retainer"
  retainerBudget: integer("retainer_budget"), // weekly budget in cents
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: text("budget").notNull(), // Display string like "$20-$30/hr"
  minRate: integer("min_rate"),
  maxRate: integer("max_rate"),
  location: text("location"),
  duration: text("duration"),
  startDate: timestamp("start_date"), // New: Stage 3 requirements
  childCount: integer("child_count"),
  selectedChildIds: jsonb("selected_child_ids").$type<string[]>().default([]), // New: Multi-child support
  isPriority: boolean("is_priority").default(false).notNull(), // New: Fast-Track Placement
  status: jobStatusEnum("status").default("open").notNull(),
  scheduleType: text("schedule_type").default("recurring").notNull(), // recurring, one_time
  schedule: jsonb("schedule").$type<Record<string, boolean>>().default({}), // The actual weekly grid
  scheduleMode: text("schedule_mode").default("simple"), // simple vs precise
  specificDates: jsonb("specific_dates").$type<string[]>().default([]), // For one_time jobs
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isDraft: boolean("is_draft").default(false).notNull(),
  isBoosted: boolean("is_boosted").default(false).notNull(),
  isSynthetic: boolean("is_synthetic").default(false).notNull(),
  
  // NEW: Structured Data-Driven Fields
  requirements: jsonb("requirements").$type<Record<string, boolean>>().default({}),
  duties: text("duties"),
  language: text("language").default("English"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Applications ───────────────────────────────────────────
export const applications = pgTable("applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobId: text("job_id").notNull().references(() => jobs.id),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  message: text("message"),
  status: applicationStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Bookings ───────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull().references(() => users.id),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  jobId: text("job_id").references(() => jobs.id),
  seriesId: text("series_id"), // Nullable initially for Stage 2
  hiringMode: text("hiring_mode").default("hourly").notNull(), // "hourly" | "retainer"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  hoursPerDay: integer("hours_per_day").notNull(),
  totalAmount: integer("total_amount").notNull(), // in cents
  notes: text("notes"),
  refinedSchedule: jsonb("refined_schedule").$type<Record<string, { start: string; end: string }>>().default({}),
  status: bookingStatusEnum("status").default("pending").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  
  // New fields for overtime/lateness logic
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  overtimeMinutes: integer("overtime_minutes").default(0).notNull(),
  latenessMinutes: integer("lateness_minutes").default(0).notNull(),
  overtimeAmount: integer("overtime_amount").default(0).notNull(), // in cents
  isOvertime: boolean("is_overtime").default(false).notNull(), // Extra shift outside retainer
  isTrial: boolean("is_trial").default(false).notNull(), // New Step 6 Overhaul: Trial Session
  retainerAdjustmentId: text("retainer_adjustment_id"), // Link to specific monthly payroll item
  
  childCount: integer("child_count").default(1).notNull(),
  selectedChildIds: jsonb("selected_child_ids").$type<string[]>().default([]),

  locationDescription: text("location_description"), // Detailed house/place description + links
  phoneNumber: text("phone_number"), // Parent's mobile for this booking
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    parentIdIdx: index("bookings_parent_id_idx").on(table.parentId),
    caregiverIdIdx: index("bookings_caregiver_id_idx").on(table.caregiverId),
    statusIdx: index("bookings_status_idx").on(table.status),
    stripePiIdx: index("bookings_stripe_pi_idx").on(table.stripePaymentIntentId),
}));

// ── Booking Series (Stage 3 overhaul) ──────────────────────
export const bookingSeries = pgTable("booking_series", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull().references(() => users.id),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // Nullable for perpetual
  startTime: text("start_time").notNull(), // e.g. "09:00"
  endTime: text("end_time").notNull(), // e.g. "17:00"
  daysOfWeek: jsonb("days_of_week").$type<number[]>().default([]).notNull(), // [1, 3, 5] for Mon, Wed, Fri
  nickname: text("nickname"),
  
  // Stage 3: Financials
  retainerAmount: integer("retainer_amount"), // Fixed monthly salary in cents
  overtimeRate: integer("overtime_rate"), // Hourly overtime rate in cents
  taxWithholding: boolean("tax_withholding").default(false).notNull(), // Enable payroll tax tracking
  billingCycle: text("billing_cycle").default("monthly").notNull(), // monthly, bi_weekly
  
  status: text("status").default("active").notNull(), // active, paused, cancelled, completed
  notes: text("notes"),
  nextBillingDate: timestamp("next_billing_date"), // New: For automated recurring charges
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Payments ───────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: text("booking_id").references(() => bookings.id),
  seriesId: text("series_id").references(() => bookingSeries.id), // New: Track retainer payments
  userId: text("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // in cents
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: paymentStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Conversations ──────────────────────────────────────────
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  isSupport: boolean("is_support").default(false).notNull(), // To distinguish peer vs mod chats
  supportStatus: supportStatusEnum("support_status").default("open").notNull(),
  assignedModeratorId: text("assigned_moderator_id").references(() => users.id),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversationMembers = pgTable("conversation_members", {
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  userId: text("user_id").notNull().references(() => users.id),
  isArchived: boolean("is_archived").default(false).notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.conversationId, table.userId] }),
}));

// ── Messages ───────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  senderId: text("sender_id").notNull().references(() => users.id),
  content: text("content"),
  fileUrl: text("file_url"),
  fileType: text("file_type"), // image, video, document
  fileName: text("file_name"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    convoIdIdx: index("messages_convo_id_idx").on(table.conversationId),
    senderIdIdx: index("messages_sender_id_idx").on(table.senderId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));

// ── Reviews ────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: text("booking_id").references(() => bookings.id),
  reviewerId: text("reviewer_id").notNull().references(() => users.id),
  revieweeId: text("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  images: jsonb("images").$type<string[]>().default([]),
  replyText: text("reply_text"),
  replyCreatedAt: timestamp("reply_created_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Support Tickets ────────────────────────────────────────
export const tickets = pgTable("tickets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  status: ticketStatusEnum("status").default("open").notNull(),
  priority: ticketPriorityEnum("priority").default("medium").notNull(),
  category: ticketCategoryEnum("category").default("general").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  moderatorId: text("moderator_id").references(() => users.id),
  conversationId: text("conversation_id").references(() => conversations.id),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketId: text("ticket_id").notNull().references(() => tickets.id),
  senderId: text("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(), // for Moderator notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Chat Unlocks ──────────────────────────────────────────
export const chatUnlocks = pgTable("chat_unlocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull().references(() => users.id),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  method: chatUnlockMethodEnum("method").notNull(),
});

// ── Platform Credit Transactions ────────────────────────────
export const platformCreditTransactions = pgTable("platform_credit_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  bookingId: text("booking_id").references(() => bookings.id),
  amount: integer("amount").notNull(), // Number of credits (can be negative)
  type: platformCreditTransactionTypeEnum("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Certifications ─────────────────────────────────────────
export const certifications = pgTable("certifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  type: certificationTypeEnum("type").notNull(),
  status: certificationStatusEnum("status").default("pending_payment").notNull(),
  stripePaymentId: text("stripe_payment_id"),
  enrolledAt: timestamp("enrolled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Certification Exams ────────────────────────────────────
export const certificationExams = pgTable("certification_exams", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  certificationType: certificationTypeEnum("certification_type").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  totalMarks: integer("total_marks").default(100).notNull(),
  passPercentage: integer("pass_percentage").default(75).notNull(),
  timeLimit: integer("time_limit").default(60).notNull(), // in minutes
  price: integer("price").notNull(), // in cents (e.g., 4500)
  retakePrice: integer("retake_price").notNull(), // in cents (e.g., 500)
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examQuestions = pgTable("exam_questions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  examId: text("exam_id").notNull().references(() => certificationExams.id),
  text: text("text").notNull(),
  marks: integer("marks").notNull(),
  page: integer("page").notNull(),
  order: integer("order").notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examSubmissions = pgTable("exam_submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  examId: text("exam_id").notNull().references(() => certificationExams.id),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  answers: jsonb("answers").$type<Record<string, string>>().default({}).notNull(),
  score: integer("score"),
  status: examStatusEnum("status").default("started").notNull(),
  examVersion: integer("exam_version").default(1).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  markedAt: timestamp("marked_at"),
  moderatorId: text("moderator_id").references(() => users.id),
  moderatorNotes: text("moderator_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Notifications ──────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // e.g., "application", "booking", "message", "payment"
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  linkUrl: text("link_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    typeIdx: index("notifications_type_idx").on(table.type),
}));

// ── Broadcast Notifications ──────────────────────────────
export const broadcastNotifications = pgTable("broadcast_notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  message: text("message").notNull(),
  linkUrl: text("link_url"),
  priority: text("priority").default("normal").notNull(), // normal, high
  targetRole: text("target_role").default("all").notNull(), // all, parent, caregiver
  senderId: text("sender_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBroadcastReads = pgTable("user_broadcast_reads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  broadcastId: text("broadcast_id").notNull().references(() => broadcastNotifications.id),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

// ── Push Subscriptions ────────────────────────────────────
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  auth: text("auth").notNull(),
  p256dh: text("p256dh").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Wallets ────────────────────────────────────────────────
export const wallets = pgTable("wallets", {
  id: text("id").primaryKey().references(() => users.id),
  balance: integer("balance").default(0).notNull(), // in cents (Available for withdrawal)
  pendingBalance: integer("pending_balance").default(0).notNull(), // in cents (Locked in Escrow)
  processingBalance: integer("processing_balance").default(0).notNull(), // in cents (Settling from bank)
  taxReserve: integer("tax_reserve").default(0).notNull(), // in cents (User-saved for taxes)
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  walletId: text("wallet_id").notNull().references(() => wallets.id),
  amount: integer("amount").notNull(), // in cents
  type: walletTransactionTypeEnum("type").notNull(),
  status: walletTransactionStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  earningType: text("earning_type"), // "retainer" | "hourly" | "overtime" | "bonus" | null
  stripeTransferId: text("stripe_transfer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    walletIdIdx: index("wallet_tx_wallet_id_idx").on(table.walletId),
    typeIdx: index("wallet_tx_type_idx").on(table.type),
    statusIdx: index("wallet_tx_status_idx").on(table.status),
}));

// ── Processed Webhook Events (Idempotency) ────────────────
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  eventId: text("event_id").primaryKey(), // Stripe event ID (evt_xxx)
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: text("actor_id").notNull().references(() => users.id),
  action: text("action").notNull(), // e.g., "VERIFY_NANNY", "RESOLVE_TICKET", "MARK_EXAM"
  entityType: text("entity_type").notNull(), // e.g., "caregiver_verification", "ticket", "exam_submission"
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata"), // details like { oldStatus: "pending", newStatus: "verified" }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Reference Submissions (NEW: Trust Automation) ──────────
export const referenceSubmissions = pgTable("reference_submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  employerEmail: text("employer_email").notNull(),
  employerName: text("employer_name").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").default("pending").notNull(), // pending, completed
  rating: integer("rating"),
  comment: text("comment"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Caregiver Verifications ────────────────────────────────
export const caregiverVerifications = pgTable("caregiver_verifications", {
  id: text("id").primaryKey().references(() => users.id),
  currentStep: integer("current_step").default(1).notNull(),
  
  // Step 1: Identity
  idFrontUrl: text("id_front_url"),
  idBackUrl: text("id_back_url"),
  selfieUrl: text("selfie_url"),
  
  // Step 2: Background Auth
  backgroundAuth: boolean("background_auth").default(false).notNull(),
  backgroundAuthTimestamp: timestamp("background_auth_timestamp"),
  
  // Step 3: References (JSONB equivalent or structured text)
  references: jsonb("references").$type<any[]>(), // Stored as jsonb for flexible structs
  
  status: verificationStatusEnum("status").default("none").notNull(),
  adminNotes: text("admin_notes"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  moderatorId: text("moderator_id").references(() => users.id),
});

// ── Parent Verifications ───────────────────────────────────
export const parentVerifications = pgTable("parent_verifications", {
  id: text("id").primaryKey().references(() => users.id),
  status: verificationStatusEnum("status").default("none").notNull(),
  
  // Step 1: Identity
  stripeIdentitySessionId: text("stripe_identity_session_id"),
  identityVerified: boolean("identity_verified").default(false).notNull(),
  
  // Step 2: Home Safety
  homeSafetyStatus: verificationStatusEnum("home_safety_status").default("none").notNull(),
  homeSafetyAdminNotes: text("home_safety_admin_notes"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  moderatorId: text("moderator_id").references(() => users.id),
});

// ── Relations ──────────────────────────────────────────────
export const usersRelations = relations(users, ({ many, one }) => ({
  nannyProfile: one(nannyProfiles),
  children: many(children),
  jobs: many(jobs),
  applications: many(applications),
  bookingsAsParent: many(bookings, { relationName: "parentBookings" }),
  bookingsAsCaregiver: many(bookings, { relationName: "caregiverBookings" }),
  sentMessages: many(messages),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "reviewee" }),
  certifications: many(certifications),
  notifications: many(notifications),
  conversationMemberships: many(conversationMembers),
  payments: many(payments),
  verification: one(caregiverVerifications),
  parentVerification: one(parentVerifications),
  parentProfile: one(parentProfiles),
  wallet: one(wallets),
  tickets: many(tickets),
  careTeamAsParent: many(careTeam, { relationName: "careTeamParent" }),
  careTeamAsCaregiver: many(careTeam, { relationName: "careTeamCaregiver" }),
  broadcastReads: many(userBroadcastReads),
  pushSubscriptions: many(pushSubscriptions),
}));

export const broadcastNotificationsRelations = relations(broadcastNotifications, ({ one, many }) => ({
    sender: one(users, { fields: [broadcastNotifications.senderId], references: [users.id] }),
    reads: many(userBroadcastReads),
}));

export const userBroadcastReadsRelations = relations(userBroadcastReads, ({ one }) => ({
    user: one(users, { fields: [userBroadcastReads.userId], references: [users.id] }),
    broadcast: one(broadcastNotifications, { fields: [userBroadcastReads.broadcastId], references: [broadcastNotifications.id] }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
    user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

export const nannyProfilesRelations = relations(nannyProfiles, ({ one }) => ({
  user: one(users, { fields: [nannyProfiles.id], references: [users.id] }),
}));

export const caregiverVerificationsRelations = relations(caregiverVerifications, ({ one }) => ({
  user: one(users, { fields: [caregiverVerifications.id], references: [users.id] }),
}));

export const parentVerificationsRelations = relations(parentVerifications, ({ one }) => ({
  user: one(users, { fields: [parentVerifications.id], references: [users.id] }),
}));

export const parentProfilesRelations = relations(parentProfiles, ({ one }) => ({
  user: one(users, { fields: [parentProfiles.id], references: [users.id] }),
}));

export const childrenRelations = relations(children, ({ one }) => ({
  parent: one(users, { fields: [children.parentId], references: [users.id] }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  parent: one(users, { fields: [jobs.parentId], references: [users.id] }),
  applications: many(applications),
  bookings: many(bookings),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  caregiver: one(users, { fields: [applications.caregiverId], references: [users.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  parent: one(users, { fields: [bookings.parentId], references: [users.id], relationName: "parentBookings" }),
  caregiver: one(users, { fields: [bookings.caregiverId], references: [users.id], relationName: "caregiverBookings" }),
  caregiverProfile: one(nannyProfiles, { fields: [bookings.caregiverId], references: [nannyProfiles.id] }),
  job: one(jobs, { fields: [bookings.jobId], references: [jobs.id] }),
  series: one(bookingSeries, { fields: [bookings.seriesId], references: [bookingSeries.id] }),
  payments: many(payments),
  reviews: many(reviews),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  series: one(bookingSeries, { fields: [payments.seriesId], references: [bookingSeries.id] }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  members: many(conversationMembers),
  messages: many(messages),
}));

export const conversationMembersRelations = relations(conversationMembers, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationMembers.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [conversationMembers.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, { fields: [reviews.bookingId], references: [bookings.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id], relationName: "reviewer" }),
  reviewee: one(users, { fields: [reviews.revieweeId], references: [users.id], relationName: "reviewee" }),
}));

export const certificationsRelations = relations(certifications, ({ one, many }) => ({
  caregiver: one(users, { fields: [certifications.caregiverId], references: [users.id] }),
  exams: many(certificationExams),
}));

export const certificationExamsRelations = relations(certificationExams, ({ many }) => ({
  questions: many(examQuestions),
  submissions: many(examSubmissions),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(certificationExams, { fields: [examQuestions.examId], references: [certificationExams.id] }),
}));

export const examSubmissionsRelations = relations(examSubmissions, ({ one }) => ({
  exam: one(certificationExams, { fields: [examSubmissions.examId], references: [certificationExams.id] }),
  caregiver: one(users, { fields: [examSubmissions.caregiverId], references: [users.id] }),
  moderator: one(users, { fields: [examSubmissions.moderatorId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.id], references: [users.id] }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, { fields: [walletTransactions.walletId], references: [wallets.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, { fields: [tickets.userId], references: [users.id] }),
  conversation: one(conversations, { fields: [tickets.conversationId], references: [conversations.id] }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketMessages.ticketId], references: [tickets.id] }),
  sender: one(users, { fields: [ticketMessages.senderId], references: [users.id] }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, { fields: [referrals.referrerId], references: [users.id], relationName: "referrer" }),
  referee: one(users, { fields: [referrals.refereeId], references: [users.id], relationName: "referee" }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorId], references: [users.id] }),
}));

export const careTeamRelations = relations(careTeam, ({ one }) => ({
  parent: one(users, { fields: [careTeam.parentId], references: [users.id], relationName: "careTeamParent" }),
  caregiver: one(users, { fields: [careTeam.caregiverId], references: [users.id], relationName: "careTeamCaregiver" }),
}));

export const bookingSeriesRelations = relations(bookingSeries, ({ one, many }) => ({
  parent: one(users, { fields: [bookingSeries.parentId], references: [users.id] }),
  caregiver: one(users, { fields: [bookingSeries.caregiverId], references: [users.id] }),
  instances: many(bookings),
  payments: many(payments),
}));

// ── Care Milestones (Stage 5 Overhaul) ────────────────────
export const careMilestones = pgTable("care_milestones", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull().references(() => users.id),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  photoUrl: text("photo_url"),
  type: text("type").default("moment").notNull(), // moment, motor_skill, funny_moment, first_word
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careMilestonesRelations = relations(careMilestones, ({ one }) => ({
    parent: one(users, { fields: [careMilestones.parentId], references: [users.id] }),
    caregiver: one(users, { fields: [careMilestones.caregiverId], references: [users.id] }),
}));

// ── Newsletter Subscribers ─────────────────────────────────
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
});

// Consistently use 'reviews' (L317) instead of 'platformReviews'
// Consistently use 'tickets' (L331) instead of 'supportTickets'
// Consistently use 'certificationExams' (L387) instead of 'exams'

// ── Search & Filter Analytics ──────────────────────────────
export const searchAnalytics = pgTable("search_analytics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id),
  queryText: text("query_text").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  filtersApplied: jsonb("filters_applied").$type<Record<string, any>>().default({}),
  resultsCount: integer("results_count").default(0).notNull(),
  convertedToContact: boolean("converted_to_contact").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Care Activities (Session Logs) ─────────────────────────
export const careActivities = pgTable("care_activities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  parentId: text("parent_id").notNull().references(() => users.id),
  caregiverId: text("caregiver_id").notNull().references(() => users.id),
  type: text("type").notNull(), // meal, sleep, activity, medication, milestone, incident
  content: text("content").notNull(),
  photoUrl: text("photo_url"),
  videoUrl: text("video_url"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const careActivitiesRelations = relations(careActivities, ({ one }) => ({
    booking: one(bookings, { fields: [careActivities.bookingId], references: [bookings.id] }),
    parent: one(users, { fields: [careActivities.parentId], references: [users.id] }),
    caregiver: one(users, { fields: [careActivities.caregiverId], references: [users.id] }),
}));
