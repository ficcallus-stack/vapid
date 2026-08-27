CREATE TABLE IF NOT EXISTS "page_visits" (
	"id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"country" text,
	"region" text,
	"city" text,
	"ip_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
