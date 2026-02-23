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
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// PROJECTS (managed by Supabase)
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
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
