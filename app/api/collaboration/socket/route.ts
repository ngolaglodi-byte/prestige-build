import { NextRequest, NextResponse } from "next/server";
import { joinRoom, leaveRoom, getRoomUsers, updateCursor } from "@/lib/collaboration/realtime-engine";

export const runtime = "nodejs";

/**
 * HTTP endpoint for WebSocket-like room management.
 * In production, upgrade to a true WebSocket via a custom server or Liveblocks.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, roomId, userId, name, color, cursor } = body as {
      action: "join" | "leave" | "cursor" | "list";
      roomId: string;
      userId?: string;
      name?: string;
      color?: string;
      cursor?: { x: number; y: number; page?: string };
    };

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    switch (action) {
      case "join": {
        if (!userId || !name) {
          return NextResponse.json({ error: "userId and name required" }, { status: 400 });
        }
        const room = joinRoom(roomId, { id: userId, name, color: color ?? "#6366F1" });
        return NextResponse.json({ users: Array.from(room.users.values()) });
      }
      case "leave": {
        if (!userId) {
          return NextResponse.json({ error: "userId required" }, { status: 400 });
        }
        leaveRoom(roomId, userId);
        return NextResponse.json({ success: true });
      }
      case "cursor": {
        if (!userId || !cursor) {
          return NextResponse.json({ error: "userId and cursor required" }, { status: 400 });
        }
        updateCursor(roomId, userId, cursor);
        return NextResponse.json({ success: true });
      }
      case "list":
        return NextResponse.json({ users: getRoomUsers(roomId) });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
