import { getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

// GET /api/templates/[templateId] — Get template details
export async function GET(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const { templateId } = params;

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  // Only allow access to public templates or own templates
  if (!data.is_public) {
    const currentUser = await getCurrentUser();
    if (!currentUser || data.user_id !== currentUser.id) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
  }

  return NextResponse.json({ template: data });
}

// DELETE /api/templates/[templateId] — Delete own template
export async function DELETE(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId } = params;

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", currentUser.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
