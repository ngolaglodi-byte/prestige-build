import { getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/templates/[templateId]/use — Create a project from a template
export async function POST(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId } = params;
  const body = await req.json();
  const projectName = body.name;

  if (!projectName) {
    return NextResponse.json(
      { error: "Project name is required." },
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
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  // Check access
  if (!template.is_public && template.user_id !== currentUser.id) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: projectName,
      user_id: currentUser.id,
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
