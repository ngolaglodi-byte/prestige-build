// app/api/projects/[projectId]/deploy/internal/route.ts
// Deploys a project to Prestige Cloud (internal hosting via Supabase Storage).

import { auth } from "@clerk/nextjs/server";
import { apiError } from "@/lib/api-response";
import { deployProject } from "@/lib/deploy/deployManager";
import { purgeCache } from "@/lib/deploy/cdnManager";
import { getDeployState } from "@/lib/deploy/deployRegistry";
import logger from "@/lib/logger";

const DEPLOY_TIMEOUT_MS = 300_000; // 5 minutes

export async function POST(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return apiError("Unauthorized", 401);

    const { projectId } = params;

    // SSE stream for progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: unknown) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }

        try {
          // Purge old cache before deploying
          await purgeCache(projectId);

          // Start internal deployment
          deployProject(projectId, "internal")
            .then(() => {
              const state = getDeployState(projectId);
              send(state ?? { status: "success" });
              controller.close();
            })
            .catch((err) => {
              send({ status: "failed", logs: err instanceof Error ? err.message : "Error" });
              controller.close();
            });

          // Poll deploy state and stream updates
          let lastStatus = "";
          const interval = setInterval(() => {
            const state = getDeployState(projectId);
            if (state && state.status !== lastStatus) {
              lastStatus = state.status;
              send(state);
              if (state.status === "success" || state.status === "failed") {
                clearInterval(interval);
              }
            }
          }, 500);

          // Safety timeout
          setTimeout(() => {
            clearInterval(interval);
            controller.close();
          }, DEPLOY_TIMEOUT_MS);
        } catch (err) {
          logger.error({ err }, "internal deploy SSE error");
          send({ status: "failed", logs: "Internal error" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    logger.error({ err }, "internal deploy route error");
    return apiError("Internal server error", 500);
  }
}
