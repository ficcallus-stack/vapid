import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

async function main() {
  const sql = neon(url!);

  console.log("🚀 Manually syncing schema...");

  const queries = [
    // users identity additions
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" timestamp;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" text;`,

    // nanny_profiles additions
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "weekly_rate" numeric(10, 2) DEFAULT '0';`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "availability" jsonb DEFAULT '{}'::jsonb;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "terms" text;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "education" text;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "response_time" text DEFAULT '15 mins';`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "last_active" timestamp DEFAULT now();`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "active_jobs_count" integer DEFAULT 0;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "specializations" jsonb DEFAULT '[]'::jsonb;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "logistics" jsonb DEFAULT '[]'::jsonb;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "core_skills" jsonb DEFAULT '[]'::jsonb;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "certifications" jsonb DEFAULT '[]'::jsonb;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "video_url" text;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "is_occupied" boolean DEFAULT false NOT NULL;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "max_travel_distance" integer DEFAULT 25 NOT NULL;`,
    `ALTER TABLE "nanny_profiles" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;`,

    // jobs additions
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "hiring_type" text DEFAULT 'hourly' NOT NULL;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "retainer_budget" integer;`,

    // bookings additions
    `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "hiring_mode" text DEFAULT 'hourly' NOT NULL;`,
    `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "is_instant" boolean DEFAULT false NOT NULL;`,

    // wallet_transactions additions
    `ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "earning_type" text;`,

    // reference_submissions
    `CREATE TABLE IF NOT EXISTS "reference_submissions" (
      "id" text PRIMARY KEY,
      "caregiver_id" text NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE,
      "employer_email" text NOT NULL,
      "employer_name" text NOT NULL,
      "token" text NOT NULL UNIQUE,
      "status" text DEFAULT 'pending' NOT NULL,
      "email_status" text DEFAULT 'pending' NOT NULL,
      "last_email_sent_at" timestamp,
      "rating" integer,
      "comment" text,
      "verified_at" timestamp,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`,

    // caregiver_verifications additions
    `ALTER TABLE "caregiver_verifications" ADD COLUMN IF NOT EXISTS "ssn" text;`,

    // audit_logs
    `CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" text PRIMARY KEY,
      "actor_id" text NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE,
      "action" text NOT NULL,
      "entity_type" text NOT NULL,
      "entity_id" text NOT NULL,
      "metadata" jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`,

    // IDENTITY MIGRATION FIX: Enable Cascading Updates for all tables referencing users.id
    // This is required because POST /api/auth/sync tries to update the Primary Key (id) 
    // when a user re-authenticates with a new Firebase UID but same email.
    `DO $$ 
    DECLARE 
        r RECORD;
    BEGIN
        FOR r IN (
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                tc.constraint_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND ccu.table_name = 'users'
              AND ccu.column_name = 'id'
              AND tc.table_schema = 'public'
        ) LOOP
            EXECUTE 'ALTER TABLE "' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '"';
            EXECUTE 'ALTER TABLE "' || r.table_name || '" ADD CONSTRAINT "' || r.constraint_name || '" FOREIGN KEY ("' || r.column_name || '") REFERENCES "users"("id") ON UPDATE CASCADE';
        END LOOP;
    END $$;`,
  ];

  for (const query of queries) {
    try {
      console.log(`Executing: ${query}`);
      // @ts-ignore - neon client types can be tricky in scripts
      await sql.query(query);
    } catch (err: any) {
      console.warn(`⚠️ Query failed but continuing: ${err.message}`);
    }
  }

  console.log("✅ Manual sync complete.");
}

main().catch(console.error);
