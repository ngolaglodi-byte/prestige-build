import { getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name } = await req.json();
  if (!id || !name) return NextResponse.json({ error: "Missing id or name" }, { status: 400 });

  const supabase = getSupabaseServiceClient();

  const userId = currentUser.id;

  const { data, error } = await supabase
    .from("projects")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ project: data });
}
