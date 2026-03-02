// lib/collab/PresenceManager.ts
// Tracks which users are currently active in a project and which file they
// are editing. Integrates with the CollabServer rooms.

export interface CollabPresence {
  userId: string;
  name: string;
  color: string;
  fileId: string | null;
  lastSeen: number;
}

const PRESENCE_TTL_MS = 30_000; // 30 sec

const presenceByProject = new Map<string, Map<string, CollabPresence>>();

export function updateCollabPresence(
  projectId: string,
  userId: string,
  info: Omit<CollabPresence, "lastSeen">
): void {
  let map = presenceByProject.get(projectId);
  if (!map) {
    map = new Map();
    presenceByProject.set(projectId, map);
  }
  map.set(userId, { ...info, lastSeen: Date.now() });
}

export function removeCollabPresence(projectId: string, userId: string): void {
  presenceByProject.get(projectId)?.delete(userId);
}

export function getCollabPresence(projectId: string): CollabPresence[] {
  const map = presenceByProject.get(projectId);
  if (!map) return [];

  const now = Date.now();
  const active: CollabPresence[] = [];
  for (const [uid, info] of map) {
    if (now - info.lastSeen > PRESENCE_TTL_MS) {
      map.delete(uid);
    } else {
      active.push(info);
    }
  }
  return active;
}

/** Deterministic color assignment from a user ID. */
const PALETTE = [
  "#6366F1", "#EC4899", "#10B981", "#F59E0B",
  "#3B82F6", "#8B5CF6", "#EF4444", "#14B8A6",
];

export function assignColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
