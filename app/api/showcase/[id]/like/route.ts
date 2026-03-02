// app/api/showcase/[id]/like/route.ts
// POST — toggle like/unlike on a showcase project.

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { showcaseProjects, showcaseLikes, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { rateLimitAsync } from "@/lib/rate-limit";
import { apiOk, apiError } from "@/lib/api-response";
import logger from "@/lib/logger";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return apiError("Non autorisé", 401);

    const rl = await rateLimitAsync(`showcase:like:${clerkId}`, 60, 60_000);
    if (!rl.success) return apiError("Trop de requêtes", 429);

    const { id: showcaseId } = params;

    // Resolve Clerk ID
    const userRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!userRows.length) return apiError("Utilisateur introuvable", 404);
    const userId = userRows[0].id;

    // Check showcase exists
    const showcase = await db
      .select({ id: showcaseProjects.id, likes: showcaseProjects.likes })
      .from(showcaseProjects)
      .where(eq(showcaseProjects.id, showcaseId))
      .limit(1);

    if (!showcase.length) return apiError("Projet introuvable", 404);

    // Check existing like
    const existing = await db
      .select({ id: showcaseLikes.id })
      .from(showcaseLikes)
      .where(and(eq(showcaseLikes.showcaseId, showcaseId), eq(showcaseLikes.userId, userId)))
      .limit(1);

    let liked: boolean;

    if (existing.length) {
      // Unlike
      await db
        .delete(showcaseLikes)
        .where(and(eq(showcaseLikes.showcaseId, showcaseId), eq(showcaseLikes.userId, userId)));

      await db
        .update(showcaseProjects)
        .set({ likes: sql`GREATEST(0, ${showcaseProjects.likes} - 1)` })
        .where(eq(showcaseProjects.id, showcaseId));

      liked = false;
    } else {
      // Like
      await db.insert(showcaseLikes).values({ showcaseId, userId });

      await db
        .update(showcaseProjects)
        .set({ likes: sql`${showcaseProjects.likes} + 1` })
        .where(eq(showcaseProjects.id, showcaseId));

      liked = true;
    }

    const updated = await db
      .select({ likes: showcaseProjects.likes })
      .from(showcaseProjects)
      .where(eq(showcaseProjects.id, showcaseId))
      .limit(1);

    logger.info({ userId, showcaseId, liked }, "Showcase like toggled");

    return apiOk({ liked, likes: updated[0]?.likes ?? 0 });
  } catch (err) {
    logger.error({ err }, "Showcase like error");
    const message = err instanceof Error ? err.message : "Erreur interne";
    return apiError(message, 500);
  }
}
