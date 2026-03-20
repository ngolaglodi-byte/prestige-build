// app/api/collab/route.ts
// HTTP-based collaboration endpoint.
// True WebSocket upgrade requires a custom server; this endpoint exposes
// a REST/SSE interface for collab operations using the CollabServer and
// PresenceManager libraries.

import { getCurrentUser } from "@/lib/auth/session";
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
    const currentUser = await getCurrentUser();
    if (!currentUser) return apiError("Unauthorized", 401);

    const body = (await req.json()) as CollabMessage;

    if (!body.projectId || !body.type) {
      return apiError("projectId and type are required", 422);
    }

    // Ensure userId is set from auth
    body.userId = currentUser.id;

    // Update presence
    if (body.type === "join" || body.type === "cursor" || body.type === "edit") {
      const name = (body.payload as { name?: string })?.name ?? currentUser.id;
      updateCollabPresence(body.projectId, currentUser.id, {
        userId: currentUser.id,
        name,
        color: assignColor(currentUser.id),
        fileId: body.fileId ?? null,
      });
    }

    if (body.type === "leave") {
      removeCollabPresence(body.projectId, currentUser.id);
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
    const currentUser = await getCurrentUser();
    if (!currentUser) return apiError("Unauthorized", 401);

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
