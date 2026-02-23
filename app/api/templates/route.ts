import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/templates — List templates (public or user's own)
export async function GET(req: Request) {
  const { userId } = await auth();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const scope = searchParams.get("scope") || "public"; // "public" | "mine"
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "12");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("templates")
    .select("*", { count: "exact" });

  if (scope === "mine") {
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    query = query.eq("user_id", userId);
  } else {
    query = query.eq("is_public", true);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (category && category !== "Tous") {
    query = query.eq("category", category);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("usage_count", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    templates: data,
    total: count ?? 0,
    page,
    pageSize,
  });
}

// POST /api/templates — Create a template
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, category, tags, files, isPublic } = body;

  if (!name || !files || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { error: "Le nom et les fichiers sont requis." },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("templates")
    .insert({
      name,
      description: description || "",
      category: category || "Web",
      tags: tags || [],
      files,
      is_public: isPublic ?? false,
      user_id: userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ template: data });
}
