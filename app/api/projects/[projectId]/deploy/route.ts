// app/api/projects/[projectId]/deploy/route.ts
// POST /api/projects/[projectId]/deploy — One-click Vercel deploy.

import { auth } from "@clerk/nextjs/server";
import { apiOk, apiError } from "@/lib/api-response";
import logger from "@/lib/logger";
import { deployProject } from "@/lib/deploy/deployManager";

export async function POST(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError("Unauthorized", 401);

    const { projectId } = params;

    logger.info({ userId, projectId }, "Deploy triggered");

    // Fire-and-forget: do not await the full deploy pipeline
    deployProject(projectId).catch((err) => {
      logger.error({ err, projectId }, "Deploy pipeline error");
    });

    return apiOk({
      projectId,
      statusUrl: `/api/projects/${projectId}/deploy/status`,
      message: "Déploiement démarré",
    });
  } catch (err) {
    logger.error({ err }, "Deploy route unexpected error");
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}
