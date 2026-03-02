// app/api/showcase/[id]/remix/route.ts
// POST — fork/clone a showcase project.

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/db/client";
import { showcaseProjects, files, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { rateLimitAsync } from "@/lib/rate-limit";
import { apiOk, apiError } from "@/lib/api-response";
import logger from "@/lib/logger";
import { getSupabaseServiceClient } from "@/lib/supabase";

const RemixBody = z.object({
  newProjectName: z.string().min(1, "Nom du projet requis").max(255).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return apiError("Non autorisé", 401);

    const rl = await rateLimitAsync(`showcase:remix:${clerkId}`, 10, 3_600_000);
    if (!rl.success) return apiError("Trop de remixes", 429);

    const { id: showcaseId } = params;

    const body = await req.json().catch(() => ({}));
    const parsed = RemixBody.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Données invalides", 422);
    }

    // Resolve Clerk ID
    const userRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!userRows.length) return apiError("Utilisateur introuvable", 404);
    const userId = userRows[0].id;

    // Fetch original showcase project
    const showcase = await db
      .select()
      .from(showcaseProjects)
      .where(eq(showcaseProjects.id, showcaseId))
      .limit(1);

    if (!showcase.length) return apiError("Projet showcase introuvable", 404);
    const originalShowcase = showcase[0];

    // Fetch files from original project
    const originalFiles = await db
      .select({ path: files.path, content: files.content })
      .from(files)
      .where(eq(files.projectId, originalShowcase.projectId));

    // Create new project via Supabase (projects table is managed by Supabase)
    const supabase = getSupabaseServiceClient();
    const newProjectName =
      parsed.data.newProjectName ?? `Remix de ${originalShowcase.title}`;

    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: newProjectName,
        user_id: userId,
        description: `Remix de "${originalShowcase.title}"`,
        framework: "react",
      })
      .select()
      .single();

    if (projectError || !newProject) {
      logger.error({ projectError }, "Failed to create remix project");
      return apiError("Impossible de créer le projet remix", 500);
    }

    const newProjectId: string = newProject.id;

    // Copy files to new project
    if (originalFiles.length > 0) {
      await db.insert(files).values(
        originalFiles.map((f) => ({
          projectId: newProjectId,
          path: f.path,
          content: f.content,
        }))
      );
    }

    // Increment remix count on the showcase entry
    await db
      .update(showcaseProjects)
      .set({ remixCount: sql`${showcaseProjects.remixCount} + 1` })
      .where(eq(showcaseProjects.id, showcaseId));

    logger.info(
      { userId, showcaseId, newProjectId, filesCopied: originalFiles.length },
      "Showcase remix created"
    );

    return apiOk({
      projectId: newProjectId,
      projectName: newProjectName,
      filesCopied: originalFiles.length,
    }, 201);
  } catch (err) {
    logger.error({ err }, "Showcase remix error");
    const message = err instanceof Error ? err.message : "Erreur interne";
    return apiError(message, 500);
  }
}
