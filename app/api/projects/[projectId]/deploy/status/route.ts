// app/api/projects/[projectId]/deploy/status/route.ts
// GET /api/projects/[projectId]/deploy/status — SSE stream of deploy state.

import { auth } from "@clerk/nextjs/server";
import { getDeployState } from "@/lib/deploy/deployRegistry";
import logger from "@/lib/logger";

const POLL_INTERVAL_MS = 1_000;
const TIMEOUT_MS = 120_000; // 2 minutes

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Non autorisé", { status: 401 });

  const { projectId } = params;
  const encoder = new TextEncoder();

  logger.info({ userId, projectId }, "Deploy status SSE stream opened");

  const readable = new ReadableStream({
    start(controller) {
      const startTime = Date.now();

      const interval = setInterval(() => {
        const state = getDeployState(projectId) ?? { status: "idle", logs: "" };
        const data = `data: ${JSON.stringify(state)}\n\n`;
        controller.enqueue(encoder.encode(data));

        const elapsed = Date.now() - startTime;
        const isDone = state.status === "success" || state.status === "failed";
        const isTimeout = elapsed >= TIMEOUT_MS;

        if (isDone || isTimeout) {
          if (isTimeout && !isDone) {
            const timeoutState = { status: "failed", logs: "Délai dépassé : le déploiement a pris trop de temps" };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(timeoutState)}\n\n`)
            );
          }
          clearInterval(interval);
          controller.close();
          logger.info({ userId, projectId, status: state.status }, "Deploy status SSE stream closed");
        }
      }, POLL_INTERVAL_MS);
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
