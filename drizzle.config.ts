import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default {
  // Only db/schema.ts is included here. db/supabase-schema.ts is intentionally
  // excluded because those tables (projects, plans, user_plans, user_limits,
  // subscriptions) are created and managed by Supabase. Including them would
  // cause Drizzle Kit to generate conflicting migrations.
  // See docs/db.md for the full schema separation strategy.
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
