// app/api/projects/[projectId]/files/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, files } from "@/db/schema";
import { projects } from "@/db/supabase-schema";
import { eq, and, asc } from "drizzle-orm";

// -----------------------------
// GET — Lister les fichiers
// -----------------------------
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;

    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const user = userRows[0];
    if (!user) return new Response("User not found", { status: 404 });

    const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    const project = projectRows[0];

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const fileList = await db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(asc(files.path));

    return NextResponse.json({ ok: true, files: fileList });
  } catch (err) {
    console.error("❌ Error loading files:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

// -----------------------------
// POST — Créer un fichier
// -----------------------------
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;
    const body = await req.json();
    const { path, content } = body;

    if (!path) {
      return new Response("Missing file path", { status: 400 });
    }

    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const user = userRows[0];
    if (!user) return new Response("User not found", { status: 404 });

    const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    const project = projectRows[0];

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const existingRows = await db
      .select()
      .from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, path)))
      .limit(1);

    if (existingRows.length > 0) {
      return new Response("File already exists", { status: 409 });
    }

    const insertedRows = await db
      .insert(files)
      .values({
        projectId,
        path,
        content: content ?? "",
      })
      .returning();

    return NextResponse.json({ ok: true, file: insertedRows[0] });
  } catch (err) {
    console.error("❌ Error creating file:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

// -----------------------------
// PATCH — Modifier un fichier
// -----------------------------
export async function PATCH(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;
    const body = await req.json();
    const { path, newPath, content } = body;

    if (!path) {
      return new Response("Missing file path", { status: 400 });
    }

    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const user = userRows[0];
    if (!user) return new Response("User not found", { status: 404 });

    const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    const project = projectRows[0];

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const existingRows = await db
      .select()
      .from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, path)))
      .limit(1);

    const existing = existingRows[0];

    if (!existing) {
      return new Response("File not found", { status: 404 });
    }

    if (newPath && newPath !== path) {
      const conflictRows = await db
        .select()
        .from(files)
        .where(and(eq(files.projectId, projectId), eq(files.path, newPath)))
        .limit(1);

      if (conflictRows.length > 0) {
        return new Response("A file with this name already exists", {
          status: 409,
        });
      }
    }

    const updatedRows = await db
      .update(files)
      .set({
        path: newPath ?? path,
        content: content ?? existing.content,
      })
      .where(and(eq(files.projectId, projectId), eq(files.path, path)))
      .returning();

    return NextResponse.json({ ok: true, file: updatedRows[0] });
  } catch (err) {
    console.error("❌ Error updating file:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

// -----------------------------
// DELETE — Supprimer un fichier
// -----------------------------
export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;
    const body = await req.json();
    const { path } = body;

    if (!path) {
      return new Response("Missing file path", { status: 400 });
    }

    // Vérifier ownership du projet
    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const user = userRows[0];
    if (!user) return new Response("User not found", { status: 404 });

    const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    const project = projectRows[0];

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // Vérifier que le fichier existe
    const existingRows = await db
      .select()
      .from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, path)))
      .limit(1);

    if (existingRows.length === 0) {
      return new Response("File not found", { status: 404 });
    }

    // Supprimer le fichier
    await db
      .delete(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, path)));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Error deleting file:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
