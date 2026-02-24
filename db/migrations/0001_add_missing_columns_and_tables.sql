-- Migration: Add missing columns and tables
-- This migration adds columns and tables that are referenced in code
-- but were missing from the initial migration.

-- 1. Add missing columns to "users" table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- 2. Add missing "is_favorite" column to "projects" table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "is_favorite" boolean NOT NULL DEFAULT false;

-- 3. Create "plans" table (used by Clerk webhook to assign free plan)
CREATE TABLE IF NOT EXISTS "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"max_active_previews" integer NOT NULL DEFAULT 1,
	"max_cpu_percent" integer NOT NULL DEFAULT 20,
	"max_memory_mb" integer NOT NULL DEFAULT 256,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);

-- 4. Create "user_plans" table (links users to their plan)
CREATE TABLE IF NOT EXISTS "user_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"plan_id" uuid NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Create "user_limits" table (per-user resource limits)
CREATE TABLE IF NOT EXISTS "user_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"max_active_previews" integer NOT NULL DEFAULT 1,
	"max_cpu_percent" integer NOT NULL DEFAULT 20,
	"max_memory_mb" integer NOT NULL DEFAULT 256,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 6. Seed the default "free" plan if it doesn't exist
INSERT INTO "plans" ("id", "name", "slug", "max_active_previews", "max_cpu_percent", "max_memory_mb")
VALUES (gen_random_uuid(), 'Free', 'free', 1, 20, 256)
ON CONFLICT ("slug") DO NOTHING;
