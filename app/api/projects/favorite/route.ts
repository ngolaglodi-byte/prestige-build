import { getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, isFavorite } = await req.json();
  if (!id || typeof isFavorite !== "boolean") {
    return NextResponse.json({ error: "Missing id or isFavorite" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Resolve Clerk ID to internal user UUID
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("id", currentUser.id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = currentUser!.id;

  const { data, error } = await supabase
    .from("projects")
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ project: data });
}
