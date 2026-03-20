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
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").default(sql`NOW()`).notNull(),
});
