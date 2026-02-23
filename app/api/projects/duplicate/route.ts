import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch original project
  const { data: original, error: fetchError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !original) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 2. Create duplicated project
  const { data: duplicated, error: insertError } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: `${original.name} (Copy)`,
      is_favorite: original.is_favorite,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  // 3. Fetch all files of original project
  const { data: files, error: filesError } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", id);

  if (filesError) {
    return NextResponse.json({ error: filesError.message }, { status: 400 });
  }

  // 4. Duplicate all files
  if (files.length > 0) {
    const duplicatedFiles = files.map((file) => ({
      project_id: duplicated.id,
      path: file.path,
      content: file.content,
    }));

    const { error: insertFilesError } = await supabase
      .from("files")
      .insert(duplicatedFiles);

    if (insertFilesError) {
      return NextResponse.json({ error: insertFilesError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ project: duplicated });
}
