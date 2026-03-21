-- Migration: Add remaining tables from schema.ts
-- These tables were defined in schema.ts but not yet migrated.

-- Create project_type enum if not exists
DO $$ BEGIN
    CREATE TYPE "project_type" AS ENUM('landing', 'website', 'webapp', 'ecommerce', 'dashboard', 'saas', 'api', 'internal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create project_limits table
CREATE TABLE IF NOT EXISTS "project_limits" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL UNIQUE,
    "project_type" "project_type" NOT NULL DEFAULT 'website',
    "db_min_mb" integer NOT NULL,
    "db_recommended_mb" integer NOT NULL,
    "storage_min_mb" integer NOT NULL,
    "storage_recommended_mb" integer NOT NULL,
    "scale_factor" double precision NOT NULL DEFAULT 1.0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create external_api_integrations table
CREATE TABLE IF NOT EXISTS "external_api_integrations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "provider" varchar(100) NOT NULL,
    "protocol" varchar(50) DEFAULT 'rest',
    "name" varchar(255) NOT NULL,
    "active" boolean NOT NULL DEFAULT true,
    "config" jsonb DEFAULT '{}',
    "api_key_hash" varchar(255),
    "last_tested_at" timestamp with time zone,
    "test_status" varchar(20) DEFAULT 'untested',
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "type" varchar(50) NOT NULL DEFAULT 'info',
    "title" varchar(255) NOT NULL,
    "message" text,
    "read" boolean NOT NULL DEFAULT false,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(255) NOT NULL,
    "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS "team_members" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
    "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "email" varchar(255) NOT NULL,
    "role" varchar(50) NOT NULL DEFAULT 'member',
    "status" varchar(50) NOT NULL DEFAULT 'pending',
    "invited_at" timestamp DEFAULT now() NOT NULL,
    "joined_at" timestamp
);

-- Create team_projects table
CREATE TABLE IF NOT EXISTS "team_projects" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
    "project_id" uuid NOT NULL,
    "added_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "added_at" timestamp DEFAULT now() NOT NULL
);

-- Create templates table
CREATE TABLE IF NOT EXISTS "templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "name" varchar(255) NOT NULL,
    "description" text,
    "framework" varchar(50) DEFAULT 'nextjs',
    "is_public" boolean NOT NULL DEFAULT false,
    "usage_count" integer NOT NULL DEFAULT 0,
    "preview_url" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create webhook_configs table
CREATE TABLE IF NOT EXISTS "webhook_configs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "url" text NOT NULL,
    "secret" varchar(255),
    "events" jsonb DEFAULT '["deploy.success","deploy.failed"]',
    "active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS "webhook_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "webhook_config_id" uuid NOT NULL REFERENCES "webhook_configs"("id") ON DELETE CASCADE,
    "event" varchar(100) NOT NULL,
    "payload" jsonb NOT NULL,
    "response_status" integer,
    "response_body" text,
    "success" boolean NOT NULL DEFAULT false,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS "integrations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "provider" varchar(50) NOT NULL,
    "active" boolean NOT NULL DEFAULT false,
    "config" jsonb DEFAULT '{}',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create admin_ai_config table
CREATE TABLE IF NOT EXISTS "admin_ai_config" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "provider" varchar(50) NOT NULL UNIQUE,
    "enabled" boolean NOT NULL DEFAULT true,
    "priority" integer NOT NULL DEFAULT 0,
    "max_tokens" integer NOT NULL DEFAULT 4096,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create files table
CREATE TABLE IF NOT EXISTS "files" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "path" text NOT NULL,
    "content" text NOT NULL DEFAULT '',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    UNIQUE ("project_id", "path")
);

-- Create preview_sessions table
CREATE TABLE IF NOT EXISTS "preview_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "port" integer NOT NULL,
    "status" varchar(50) NOT NULL,
    "cpu_percent" double precision,
    "memory_mb" integer,
    "started_at" timestamp DEFAULT now() NOT NULL,
    "stopped_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create builds table
CREATE TABLE IF NOT EXISTS "builds" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "framework" varchar(50) NOT NULL DEFAULT 'nextjs',
    "status" varchar(50) NOT NULL DEFAULT 'pending',
    "build_logs" text,
    "output_path" text,
    "duration_ms" integer,
    "started_at" timestamp DEFAULT now() NOT NULL,
    "finished_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create showcase_projects table
CREATE TABLE IF NOT EXISTS "showcase_projects" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL UNIQUE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" varchar(255) NOT NULL,
    "description" text,
    "preview_url" text,
    "thumbnail_url" text,
    "tags" jsonb DEFAULT '[]',
    "likes_count" integer NOT NULL DEFAULT 0,
    "comments_count" integer NOT NULL DEFAULT 0,
    "views_count" integer NOT NULL DEFAULT 0,
    "featured" boolean NOT NULL DEFAULT false,
    "published_at" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create showcase_likes table
CREATE TABLE IF NOT EXISTS "showcase_likes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "showcase_project_id" uuid NOT NULL REFERENCES "showcase_projects"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL,
    UNIQUE ("showcase_project_id", "user_id")
);

-- Create showcase_comments table
CREATE TABLE IF NOT EXISTS "showcase_comments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "showcase_project_id" uuid NOT NULL REFERENCES "showcase_projects"("id") ON DELETE CASCADE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "parent_id" uuid REFERENCES "showcase_comments"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create conversation_sessions table
CREATE TABLE IF NOT EXISTS "conversation_sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" varchar(255),
    "messages" jsonb DEFAULT '[]',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create agent_plans table
CREATE TABLE IF NOT EXISTS "agent_plans" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "session_id" uuid NOT NULL REFERENCES "conversation_sessions"("id") ON DELETE CASCADE,
    "project_id" uuid NOT NULL,
    "goal" text NOT NULL,
    "steps" jsonb NOT NULL DEFAULT '[]',
    "current_step" integer NOT NULL DEFAULT 0,
    "status" varchar(50) NOT NULL DEFAULT 'pending',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now()
);

-- Create github_sync_configs table
CREATE TABLE IF NOT EXISTS "github_sync_configs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL UNIQUE,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "repository_owner" varchar(255) NOT NULL,
    "repository_name" varchar(255) NOT NULL,
    "branch" varchar(255) NOT NULL DEFAULT 'main',
    "sync_direction" varchar(20) NOT NULL DEFAULT 'both',
    "auto_sync" boolean NOT NULL DEFAULT false,
    "last_synced_at" timestamp with time zone,
    "last_commit_sha" varchar(40),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Create deployment_environments table
CREATE TABLE IF NOT EXISTS "deployment_environments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "project_id" uuid NOT NULL,
    "name" varchar(50) NOT NULL,
    "vercel_deployment_id" varchar(255),
    "url" text,
    "status" varchar(50) NOT NULL DEFAULT 'pending',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now(),
    UNIQUE ("project_id", "name")
);

-- Create marketplace_favorites table
CREATE TABLE IF NOT EXISTS "marketplace_favorites" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "template_id" uuid NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
    "created_at" timestamp DEFAULT now() NOT NULL,
    UNIQUE ("user_id", "template_id")
);

-- Add sessions table if not exists
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "revoked_at" timestamp with time zone,
    "ip" varchar(45),
    "user_agent" text
);

-- Add audit_logs table if not exists
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "action" varchar(100) NOT NULL,
    "target_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add user_role enum if not exists
DO $$ BEGIN
    CREATE TYPE "user_role" AS ENUM('ADMIN', 'AGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add user_status enum if not exists
DO $$ BEGIN
    CREATE TYPE "user_status" AS ENUM('ACTIVE', 'DISABLED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_change_password" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'PENDING';

-- Modify api_keys table to add missing columns
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "key_hash" varchar(255);
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "key_prefix" varchar(12);
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "revoked" boolean NOT NULL DEFAULT false;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "rate_limit" integer NOT NULL DEFAULT 100;
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "last_used_at" timestamp with time zone;


-- Add foreign key constraints for project_id columns
-- Using ALTER TABLE to add constraints after all tables are created

-- project_limits FK to projects
ALTER TABLE "project_limits" 
    ADD CONSTRAINT IF NOT EXISTS "project_limits_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- external_api_integrations FK to projects
ALTER TABLE "external_api_integrations" 
    ADD CONSTRAINT IF NOT EXISTS "external_api_integrations_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- team_projects FK to projects
ALTER TABLE "team_projects" 
    ADD CONSTRAINT IF NOT EXISTS "team_projects_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- webhook_configs FK to projects
ALTER TABLE "webhook_configs" 
    ADD CONSTRAINT IF NOT EXISTS "webhook_configs_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- files FK to projects
ALTER TABLE "files" 
    ADD CONSTRAINT IF NOT EXISTS "files_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- preview_sessions FK to projects
ALTER TABLE "preview_sessions" 
    ADD CONSTRAINT IF NOT EXISTS "preview_sessions_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- preview_sessions FK to users
ALTER TABLE "preview_sessions" 
    ADD CONSTRAINT IF NOT EXISTS "preview_sessions_user_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- builds FK to projects
ALTER TABLE "builds" 
    ADD CONSTRAINT IF NOT EXISTS "builds_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- showcase_projects FK to projects
ALTER TABLE "showcase_projects" 
    ADD CONSTRAINT IF NOT EXISTS "showcase_projects_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- conversation_sessions FK to projects
ALTER TABLE "conversation_sessions" 
    ADD CONSTRAINT IF NOT EXISTS "conversation_sessions_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- agent_plans FK to projects
ALTER TABLE "agent_plans" 
    ADD CONSTRAINT IF NOT EXISTS "agent_plans_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- github_sync_configs FK to projects
ALTER TABLE "github_sync_configs" 
    ADD CONSTRAINT IF NOT EXISTS "github_sync_configs_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

-- deployment_environments FK to projects
ALTER TABLE "deployment_environments" 
    ADD CONSTRAINT IF NOT EXISTS "deployment_environments_project_id_fk" 
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;
