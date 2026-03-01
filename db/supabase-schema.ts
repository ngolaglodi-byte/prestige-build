/**
 * Tables managed by Supabase (already exist in the database).
 * These are NOT included in drizzle.config.ts, so Drizzle will NOT
 * generate migrations for them. They are kept here only for
 * type-safe querying with drizzle-orm.
 */
import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// PROJECTS (managed by Supabase)
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});

// PLANS (managed by Supabase)
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  maxActivePreviews: integer("max_active_previews").notNull().default(1),
  maxCpuPercent: integer("max_cpu_percent").notNull().default(20),
  maxMemoryMb: integer("max_memory_mb").notNull().default(256),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// USER PLANS (managed by Supabase)
export const userPlans = pgTable("user_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  planId: uuid("plan_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// USER LIMITS (managed by Supabase)
export const userLimits = pgTable("user_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  maxActivePreviews: integer("max_active_previews").notNull().default(1),
  maxCpuPercent: integer("max_cpu_percent").notNull().default(20),
  maxMemoryMb: integer("max_memory_mb").notNull().default(256),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// SUBSCRIPTIONS (managed by Supabase)
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  plan: varchar("plan", { length: 20 }).notNull(),
  creditsMonthly: integer("credits_monthly").notNull(),
  creditsRemaining: integer("credits_remaining").notNull(),
  storageLimitMb: integer("storage_limit_mb").notNull(),
  dbLimitMb: integer("db_limit_mb").notNull(),
  priceUsd: integer("price_usd").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  renewalDate: timestamp("renewal_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
