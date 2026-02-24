import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { getPlan } from "@/lib/billing/plans";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      console.error("[projects/create] Unauthorized: no userId from Clerk");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      console.error("[projects/create] Validation failed: name is missing or empty");
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[projects/create] Supabase configuration missing", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve Clerk ID to internal user UUID
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkId)
      .single();

    if (userError || !user) {
      console.warn("[projects/create] User not found for clerkId, attempting to create:", clerkId);

      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkId);
        const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? `${clerkId}@unknown.clerk`;
        const userName = clerkUser.firstName ?? "User";
        const now = new Date().toISOString();
        const newUserId = randomUUID();

        const { error: insertUserError } = await supabase
          .from("users")
          .insert({
            id: newUserId,
            clerk_id: clerkId,
            email: userEmail,
            name: userName,
            role: "user",
            created_at: now,
            updated_at: now,
          });

        if (insertUserError) {
          console.error("[projects/create] Failed to create user:", insertUserError);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const freePlan = getPlan("free");
        const { error: subError } = await supabase.from("subscriptions").insert({
          id: randomUUID(),
          user_id: newUserId,
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
          console.error("[projects/create] Failed to create subscription for fallback user:", subError);
        }

        console.log("[projects/create] User created via fallback:", newUserId);
        user = { id: newUserId };
      } catch (fallbackErr) {
        console.error("[projects/create] Fallback user creation failed:", fallbackErr);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const userId = user.id;

    const now = new Date().toISOString();
    const id = randomUUID();

    console.log("[projects/create] Inserting into table 'projects' (lowercase):", {
      id,
      user_id: userId,
      name: name.trim(),
    });

    const { data, error } = await supabase
      .from("projects")
      .insert({
        id,
        user_id: userId,
        name: name.trim(),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[projects/create] Supabase insert error on table 'projects':", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[projects/create] Successfully inserted into 'projects' table:", data?.id);

    return NextResponse.json({ project: data });
  } catch (err) {
    console.error("[projects/create] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
