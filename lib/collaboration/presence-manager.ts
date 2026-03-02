/**
 * Manages user presence: who is online, what page they're viewing, cursor positions.
 */

export interface PresenceInfo {
  userId: string;
  name: string;
  color: string;
  page: string;
  cursor: { x: number; y: number } | null;
  lastSeen: number;
}

const PRESENCE_TIMEOUT_MS = 30_000; // 30 seconds

const presenceMap = new Map<string, Map<string, PresenceInfo>>();

export function updatePresence(
  roomId: string,
  userId: string,
  info: Omit<PresenceInfo, "lastSeen">
): void {
  let room = presenceMap.get(roomId);
  if (!room) {
    room = new Map();
    presenceMap.set(roomId, room);
  }
  room.set(userId, { ...info, lastSeen: Date.now() });
}

export function removePresence(roomId: string, userId: string): void {
  presenceMap.get(roomId)?.delete(userId);
}

export function getPresence(roomId: string): PresenceInfo[] {
  const room = presenceMap.get(roomId);
  if (!room) return [];

  const now = Date.now();
  const active: PresenceInfo[] = [];
  for (const [uid, info] of room) {
    if (now - info.lastSeen > PRESENCE_TIMEOUT_MS) {
      room.delete(uid);
    } else {
      active.push(info);
    }
  }
  return active;
}

/**
 * Assigns a deterministic color to a user based on their ID.
 */
const COLORS = [
  "#6366F1", "#EC4899", "#10B981", "#F59E0B",
  "#3B82F6", "#8B5CF6", "#EF4444", "#14B8A6",
];

export function userColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
