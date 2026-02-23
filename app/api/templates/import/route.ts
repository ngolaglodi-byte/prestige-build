import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/templates/import — Import a template from JSON
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, category, tags, files } = body;

  if (!name || !files || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { error: "Le fichier JSON doit contenir un nom et des fichiers." },
      { status: 400 }
    );
  }

  // Validate file structure
  for (const file of files) {
    if (!file.path || typeof file.content !== "string") {
      return NextResponse.json(
        { error: "Chaque fichier doit avoir un chemin (path) et un contenu (content)." },
        { status: 400 }
      );
    }
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
      is_public: false,
      user_id: userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ template: data });
}
