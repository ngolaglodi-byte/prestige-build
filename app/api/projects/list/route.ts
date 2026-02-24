import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      console.error("[projects/list] Unauthorized: no userId from Clerk");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "6")));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[projects/list] Supabase configuration missing", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve Clerk ID to internal user UUID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkId)
      .single();

    if (userError || !user) {
      console.error("[projects/list] User not found for clerkId:", clerkId, userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;

    console.log("[projects/list] Querying table 'projects' (lowercase) for userId:", userId);

    let query = supabase
      .from("projects")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[projects/list] Supabase query error on table 'projects':", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`[projects/list] Found ${count ?? 0} projects in 'projects' table for userId: ${userId}`);

    return NextResponse.json({
      projects: data || [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("[projects/list] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
