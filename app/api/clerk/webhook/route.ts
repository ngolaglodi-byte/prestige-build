import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { getPlan } from "@/lib/billing/plans";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase configuration missing");
  return createClient(url, key);
}

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    return new Response("Missing Clerk webhook signing secret", { status: 500 });
  }

  const wh = new Webhook(SIGNING_SECRET);
  const payload = await req.text();
  const headerPayload = headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: { type: string; data: Record<string, any> };

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as { type: string; data: Record<string, any> };
  } catch (err) {
    console.error("❌ Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = event;
  const supabase = getSupabase();

  const email = data.email_addresses?.[0]?.email_address ?? null;
  const name = data.first_name ?? "User";

  // ---------------------------------------------------------
  // USER CREATED
  // ---------------------------------------------------------
  if (type === "user.created") {
    console.log("👤 [clerk/webhook] Creating user:", data.id);

    const now = new Date().toISOString();
    const userId = randomUUID();

    // 1. Insert into "users" table (lowercase — matches Drizzle schema)
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        clerk_id: data.id,
        email,
        name,
        role: "user",
        created_at: now,
        updated_at: now,
      });

    if (userError) {
      console.error("❌ [clerk/webhook] Error creating user:", userError);
      return new Response("Error creating user", { status: 500 });
    }

    console.log("✅ [clerk/webhook] User inserted into 'users' table:", userId);

    // 2. Ensure "free" plan exists in "plans" table
    const { data: existingPlan } = await supabase
      .from("plans")
      .select("id")
      .eq("slug", "free")
      .single();

    let planId = existingPlan?.id;

    if (!planId) {
      const newPlanId = randomUUID();
      const { error: planError } = await supabase
        .from("plans")
        .insert({
          id: newPlanId,
          name: "Free",
          slug: "free",
          max_active_previews: 1,
          max_cpu_percent: 20,
          max_memory_mb: 256,
          created_at: now,
          updated_at: now,
        });

      if (planError) {
        console.error("❌ [clerk/webhook] Error creating free plan:", planError);
      } else {
        planId = newPlanId;
        console.log("✅ [clerk/webhook] Free plan created in 'plans' table");
      }
    }

    // 3. Create UserPlan entry in "user_plans" table
    if (planId) {
      const { error: userPlanError } = await supabase
        .from("user_plans")
        .insert({
          id: randomUUID(),
          user_id: userId,
          plan_id: planId,
          created_at: now,
        });

      if (userPlanError) {
        console.error("❌ [clerk/webhook] Error creating user_plan:", userPlanError);
      } else {
        console.log("✅ [clerk/webhook] UserPlan created with free plan");
      }
    }

    // 4. Create UserLimits entry in "user_limits" table
    const { error: limitsError } = await supabase
      .from("user_limits")
      .insert({
        id: randomUUID(),
        user_id: userId,
        max_active_previews: 1,
        max_cpu_percent: 20,
        max_memory_mb: 256,
        created_at: now,
        updated_at: now,
      });

    if (limitsError) {
      console.error("❌ [clerk/webhook] Error creating user_limits:", limitsError);
    } else {
      console.log("✅ [clerk/webhook] UserLimits created with default resource limits");
    }

    // 5. Create subscription entry in "subscriptions" table for billing
    const freePlan = getPlan("free");

    const { error: subError } = await supabase
      .from("subscriptions")
      .insert({
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
      console.error("❌ [clerk/webhook] Error creating subscription:", subError);
    } else {
      console.log("✅ [clerk/webhook] Free subscription created in 'subscriptions' table");
    }

    console.log("✅ [clerk/webhook] User created with FREE plan and default limits");
  }

  // ---------------------------------------------------------
  // USER UPDATED
  // ---------------------------------------------------------
  if (type === "user.updated") {
    console.log("🔄 [clerk/webhook] Updating user:", data.id);

    const { error } = await supabase
      .from("users")
      .update({
        email,
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_id", data.id);

    if (error) {
      console.error("❌ [clerk/webhook] Error updating user:", error);
      return new Response("Error updating user", { status: 500 });
    }

    console.log("✅ [clerk/webhook] User updated");
  }

  // ---------------------------------------------------------
  // USER DELETED
  // ---------------------------------------------------------
  if (type === "user.deleted") {
    console.log("🗑️ [clerk/webhook] Deleting user:", data.id);

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("clerk_id", data.id);

    if (error) {
      console.error("❌ [clerk/webhook] Error deleting user:", error);
      return new Response("Error deleting user", { status: 500 });
    }

    console.log("✅ [clerk/webhook] User deleted");
  }

  return new Response("Webhook processed", { status: 200 });
}
