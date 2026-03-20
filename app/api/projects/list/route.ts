import { getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error("[projects/list] Unauthorized: no userId from Clerk");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "6")));

    // User is already available from currentUser
    const userId = currentUser!.id;

    const supabase = getSupabaseServiceClient();

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
