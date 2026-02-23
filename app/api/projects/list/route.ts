import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "6");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    projects: data,
    total: count ?? 0,
    page,
    pageSize,
  });
}
