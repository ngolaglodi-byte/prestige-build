/**
 * Real-time synchronisation engine using native WebSocket (ws).
 * Manages rooms, broadcasts, and client connections.
 */

export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number; page?: string };
}

export interface RoomState {
  id: string;
  users: Map<string, CollaborationUser>;
}

const rooms = new Map<string, RoomState>();

export function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = { id: roomId, users: new Map() };
    rooms.set(roomId, room);
  }
  return room;
}

export function joinRoom(roomId: string, user: CollaborationUser): RoomState {
  const room = getOrCreateRoom(roomId);
  room.users.set(user.id, user);
  return room;
}

export function leaveRoom(roomId: string, userId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  room.users.delete(userId);
  if (room.users.size === 0) rooms.delete(roomId);
}

export function updateCursor(
  roomId: string,
  userId: string,
  cursor: { x: number; y: number; page?: string }
): void {
  const room = rooms.get(roomId);
  const user = room?.users.get(userId);
  if (user) user.cursor = cursor;
}

export function getRoomUsers(roomId: string): CollaborationUser[] {
  const room = rooms.get(roomId);
  return room ? Array.from(room.users.values()) : [];
}

export function getAllRooms(): string[] {
  return Array.from(rooms.keys());
}
