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
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// PROJECTS (managed by Supabase)
// NOTE: This schema must match the actual table in Supabase.
// The is_favorite column is optional to support databases where it may not exist.
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});
