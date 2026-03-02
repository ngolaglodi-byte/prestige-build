import { NextRequest, NextResponse } from "next/server";
import { updatePresence, getPresence, removePresence, userColor } from "@/lib/collaboration/presence-manager";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, roomId, userId, name, page, cursor } = body as {
      action: "update" | "leave" | "list";
      roomId: string;
      userId?: string;
      name?: string;
      page?: string;
      cursor?: { x: number; y: number } | null;
    };

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    switch (action) {
      case "update": {
        if (!userId || !name) {
          return NextResponse.json({ error: "userId and name required" }, { status: 400 });
        }
        updatePresence(roomId, userId, {
          userId,
          name,
          color: userColor(userId),
          page: page ?? "/",
          cursor: cursor ?? null,
        });
        return NextResponse.json({ presence: getPresence(roomId) });
      }
      case "leave": {
        if (!userId) {
          return NextResponse.json({ error: "userId required" }, { status: 400 });
        }
        removePresence(roomId, userId);
        return NextResponse.json({ success: true });
      }
      case "list":
        return NextResponse.json({ presence: getPresence(roomId) });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
