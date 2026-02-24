import { clerkClient } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getPlan } from "@/lib/billing/plans";

/**
 * Ensures a user exists in the Supabase `users` table.
 * If the user does not exist, fetches user info from Clerk and creates the user,
 * along with default subscription, user_plan, and user_limits records.
 *
 * This function is idempotent and safe to call multiple times.
 */
export async function ensureUserExists(
  clerkId: string
): Promise<{ id: string; email: string; name: string | null; role: string }> {
  const supabase = getSupabaseServiceClient();

  // Check if user already exists
  const { data: existingUser, error: lookupError } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("clerk_id", clerkId)
    .single();

  if (existingUser) {
    return existingUser as { id: string; email: string; name: string | null; role: string };
  }

  // User not found — fetch from Clerk and create
  if (lookupError && lookupError.code !== "PGRST116") {
    // PGRST116 = "no rows returned", any other error is unexpected
    console.error("[ensureUserExists] Unexpected error looking up user:", lookupError);
  }

  console.warn("[ensureUserExists] User not found for clerkId, creating:", clerkId);

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkId);
  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress ?? `${clerkId}@unknown.clerk`;
  const name = clerkUser.firstName ?? "User";
  const now = new Date().toISOString();
  const userId = randomUUID();
  const freePlan = getPlan("free");

  // 1. Insert into "users" table
  const { error: userInsertError } = await supabase.from("users").insert({
    id: userId,
    clerk_id: clerkId,
    email,
    name,
    role: "user",
    created_at: now,
    updated_at: now,
  });

  if (userInsertError) {
    // Handle race condition: another request may have created the user concurrently
    if (userInsertError.code === "23505") {
      console.warn("[ensureUserExists] Race condition — user already exists, re-fetching");
      const { data: raceUser, error: raceError } = await supabase
        .from("users")
        .select("id, email, name, role")
        .eq("clerk_id", clerkId)
        .single();

      if (raceUser) {
        return raceUser as { id: string; email: string; name: string | null; role: string };
      }
      throw new Error(`[ensureUserExists] Failed to re-fetch user after race condition: ${raceError?.message}`);
    }
    throw new Error(`[ensureUserExists] Failed to create user: ${userInsertError.message}`);
  }

  console.log("[ensureUserExists] User inserted:", userId);

  // 2. Ensure "free" plan exists in "plans" table
  const { data: existingPlan } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", "free")
    .single();

  let planId = existingPlan?.id;

  if (!planId) {
    const newPlanId = randomUUID();
    const { error: planError } = await supabase.from("plans").insert({
      id: newPlanId,
      name: "Free",
      slug: "free",
      max_active_previews: freePlan.limits.maxProjects,
      max_cpu_percent: 20,
      max_memory_mb: freePlan.limits.workspaceSizeMb,
      created_at: now,
      updated_at: now,
    });

    if (planError) {
      throw new Error(`[ensureUserExists] Failed to create free plan: ${planError.message}`);
    }
    planId = newPlanId;
  }

  // 3. Create user_plans entry
  const { error: userPlanError } = await supabase.from("user_plans").insert({
    id: randomUUID(),
    user_id: userId,
    plan_id: planId,
    created_at: now,
  });

  if (userPlanError) {
    throw new Error(`[ensureUserExists] Failed to create user_plan: ${userPlanError.message}`);
  }

  // 4. Create user_limits entry
  const { error: limitsError } = await supabase.from("user_limits").insert({
    id: randomUUID(),
    user_id: userId,
    max_active_previews: freePlan.limits.maxProjects,
    max_cpu_percent: 20,
    max_memory_mb: freePlan.limits.workspaceSizeMb,
    created_at: now,
    updated_at: now,
  });

  if (limitsError) {
    throw new Error(`[ensureUserExists] Failed to create user_limits: ${limitsError.message}`);
  }

  // 5. Create subscription entry
  const { error: subError } = await supabase.from("subscriptions").insert({
    id: randomUUID(),
    user_id: userId,
    plan: "free",
    credits_monthly: freePlan.credits,
    credits_remaining: freePlan.credits,
    storage_limit_mb: freePlan.limits.workspaceSizeMb,
    db_limit_mb: 50,
    price_usd: freePlan.priceUsd,
    status: "active",
    created_at: now,
  });

  if (subError) {
    throw new Error(`[ensureUserExists] Failed to create subscription: ${subError.message}`);
  }

  console.log("[ensureUserExists] User created with FREE plan and default limits:", userId);

  return { id: userId, email, name, role: "user" };
}
