// lib/collab/CollabServer.ts
// WebSocket-based collaboration server for real-time code editing.
// Manages rooms (one per project), broadcasts edits, cursors, and selections.

export interface CollabMessage {
  type: "join" | "leave" | "edit" | "cursor" | "select" | "sync";
  userId: string;
  projectId: string;
  fileId?: string;
  payload: unknown;
}

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  fileId?: string;
  cursor?: { line: number; column: number };
  selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
}

export interface CollabRoom {
  projectId: string;
  users: Map<string, CollabUser>;
}

// In-memory room store
const rooms = new Map<string, CollabRoom>();

export function getOrCreateCollabRoom(projectId: string): CollabRoom {
  let room = rooms.get(projectId);
  if (!room) {
    room = { projectId, users: new Map() };
    rooms.set(projectId, room);
  }
  return room;
}

export function joinCollabRoom(projectId: string, user: CollabUser): CollabRoom {
  const room = getOrCreateCollabRoom(projectId);
  room.users.set(user.id, user);
  return room;
}

export function leaveCollabRoom(projectId: string, userId: string): void {
  const room = rooms.get(projectId);
  if (!room) return;
  room.users.delete(userId);
  if (room.users.size === 0) rooms.delete(projectId);
}

export function updateCollabCursor(
  projectId: string,
  userId: string,
  cursor: { line: number; column: number },
  fileId?: string
): void {
  const room = rooms.get(projectId);
  const user = room?.users.get(userId);
  if (user) {
    user.cursor = cursor;
    if (fileId) user.fileId = fileId;
  }
}

export function updateCollabSelection(
  projectId: string,
  userId: string,
  selection: { startLine: number; startColumn: number; endLine: number; endColumn: number }
): void {
  const room = rooms.get(projectId);
  const user = room?.users.get(userId);
  if (user) user.selection = selection;
}

export function getCollabRoomUsers(projectId: string): CollabUser[] {
  const room = rooms.get(projectId);
  return room ? Array.from(room.users.values()) : [];
}

export function getAllCollabRooms(): string[] {
  return Array.from(rooms.keys());
}

/**
 * Process a collab message and return the broadcast payload (or null to skip).
 */
export function processMessage(msg: CollabMessage): CollabMessage | null {
  switch (msg.type) {
    case "join":
      joinCollabRoom(msg.projectId, {
        id: msg.userId,
        name: (msg.payload as { name?: string })?.name ?? msg.userId,
        color: (msg.payload as { color?: string })?.color ?? "#6366F1",
      });
      return msg;

    case "leave":
      leaveCollabRoom(msg.projectId, msg.userId);
      return msg;

    case "edit":
    case "cursor":
    case "select":
      // Broadcast as-is to other participants
      if (msg.type === "cursor" && msg.payload) {
        const p = msg.payload as { line: number; column: number };
        updateCollabCursor(msg.projectId, msg.userId, p, msg.fileId);
      }
      if (msg.type === "select" && msg.payload) {
        const s = msg.payload as {
          startLine: number; startColumn: number;
          endLine: number; endColumn: number;
        };
        updateCollabSelection(msg.projectId, msg.userId, s);
      }
      return msg;

    case "sync":
      return msg;

    default:
      return null;
  }
}
