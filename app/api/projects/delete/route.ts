import { getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseServiceClient();

  const userId = currentUser.id;

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
