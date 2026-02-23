import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/templates/[templateId] — Get template details
export async function GET(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const { templateId } = params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Template introuvable." }, { status: 404 });
  }

  // Only allow access to public templates or own templates
  if (!data.is_public) {
    const { userId } = await auth();
    if (!userId || data.user_id !== userId) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
  }

  return NextResponse.json({ template: data });
}

// DELETE /api/templates/[templateId] — Delete own template
export async function DELETE(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
