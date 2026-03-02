// app/api/collab/route.ts
// HTTP-based collaboration endpoint.
// True WebSocket upgrade requires a custom server; this endpoint exposes
// a REST/SSE interface for collab operations using the CollabServer and
// PresenceManager libraries.

import { auth } from "@clerk/nextjs/server";
import { apiOk, apiError } from "@/lib/api-response";
import {
  processMessage,
  getCollabRoomUsers,
  type CollabMessage,
} from "@/lib/collab/CollabServer";
import {
  updateCollabPresence,
  removeCollabPresence,
  getCollabPresence,
  assignColor,
} from "@/lib/collab/PresenceManager";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return apiError("Unauthorized", 401);

    const body = (await req.json()) as CollabMessage;

    if (!body.projectId || !body.type) {
      return apiError("projectId and type are required", 422);
    }

    // Ensure userId is set from auth
    body.userId = clerkId;

    // Update presence
    if (body.type === "join" || body.type === "cursor" || body.type === "edit") {
      const name = (body.payload as { name?: string })?.name ?? clerkId;
      updateCollabPresence(body.projectId, clerkId, {
        userId: clerkId,
        name,
        color: assignColor(clerkId),
        fileId: body.fileId ?? null,
      });
    }

    if (body.type === "leave") {
      removeCollabPresence(body.projectId, clerkId);
    }

    const broadcast = processMessage(body);
    const users = getCollabRoomUsers(body.projectId);
    const presence = getCollabPresence(body.projectId);

    return apiOk({ broadcast, users, presence });
  } catch (err) {
    logger.error({ err }, "collab route error");
    return apiError("Internal server error", 500);
  }
}

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return apiError("projectId query param required", 422);

    const users = getCollabRoomUsers(projectId);
    const presence = getCollabPresence(projectId);

    return apiOk({ users, presence });
  } catch (err) {
    logger.error({ err }, "collab GET error");
    return apiError("Internal server error", 500);
  }
}
