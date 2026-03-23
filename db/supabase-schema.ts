/**
 * Tables managed by Supabase (already exist in the database).
 * These are NOT included in drizzle.config.ts, so Drizzle will NOT
 * generate migrations for them. They are kept here only for
 * type-safe querying with drizzle-orm.
 * 
 * NOTE: The `projects` table has been moved to db/schema.ts to be managed
 * by Drizzle migrations. This file is kept for future Supabase-managed tables.
 */

// Currently empty - all tables are now managed by Drizzle in db/schema.ts
// If new Supabase-managed tables are added, define them here for type-safe queries.

// Export an empty object to make this file a valid module
export {};
