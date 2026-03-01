import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/templates/[templateId]/use — Create a project from a template
export async function POST(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId } = params;
  const body = await req.json();
  const projectName = body.name;

  if (!projectName) {
    return NextResponse.json(
      { error: "Le nom du projet est requis." },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch the template
  const { data: template, error: templateError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    return NextResponse.json({ error: "Template introuvable." }, { status: 404 });
  }

  // Check access
  if (!template.is_public && template.user_id !== userId) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: projectName,
      user_id: userId,
    })
    .select()
    .single();

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 400 });
  }

  // Increment usage count
  await supabase
    .from("templates")
    .update({ usage_count: (template.usage_count || 0) + 1 })
    .eq("id", templateId);

  return NextResponse.json({
    project,
    templateFiles: template.files,
  });
}
