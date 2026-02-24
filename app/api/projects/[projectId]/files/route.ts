// app/api/projects/[projectId]/files/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return new Response("User not found", { status: 404 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const files = await prisma.file.findMany({
      where: { projectId },
      orderBy: { path: "asc" },
    });

    return NextResponse.json({ ok: true, files });
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

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return new Response("User not found", { status: 404 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const existing = await prisma.file.findUnique({
      where: {
        projectId_path: {
          projectId,
          path,
        },
      },
    });

    if (existing) {
      return new Response("File already exists", { status: 409 });
    }

    const file = await prisma.file.create({
      data: {
        projectId,
        path,
        content: content ?? "",
      },
    });

    return NextResponse.json({ ok: true, file });
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

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return new Response("User not found", { status: 404 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const existing = await prisma.file.findUnique({
      where: {
        projectId_path: {
          projectId,
          path,
        },
      },
    });

    if (!existing) {
      return new Response("File not found", { status: 404 });
    }

    if (newPath && newPath !== path) {
      const conflict = await prisma.file.findUnique({
        where: {
          projectId_path: {
            projectId,
            path: newPath,
          },
        },
      });

      if (conflict) {
        return new Response("A file with this name already exists", {
          status: 409,
        });
      }
    }

    const updated = await prisma.file.update({
      where: {
        projectId_path: {
          projectId,
          path,
        },
      },
      data: {
        path: newPath ?? path,
        content: content ?? existing.content,
      },
    });

    return NextResponse.json({ ok: true, file: updated });
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
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return new Response("User not found", { status: 404 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // Vérifier que le fichier existe
    const existing = await prisma.file.findUnique({
      where: {
        projectId_path: {
          projectId,
          path,
        },
      },
    });

    if (!existing) {
      return new Response("File not found", { status: 404 });
    }

    // Supprimer le fichier
    await prisma.file.delete({
      where: {
        projectId_path: {
          projectId,
          path,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Error deleting file:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
