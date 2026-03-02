/**
 * Conflict resolution utilities for concurrent edits.
 */

export interface Edit {
  path: string;
  content: string;
  timestamp: number;
  author: string;
}

/**
 * Last-writer-wins conflict resolution for file-level edits.
 */
export function resolveConflict(edits: Edit[]): Edit | null {
  if (edits.length === 0) return null;
  return edits.reduce((latest, e) => (e.timestamp > latest.timestamp ? e : latest));
}

/**
 * Detects if two edits conflict (same path, different authors, close timestamps).
 */
export function hasConflict(a: Edit, b: Edit, thresholdMs: number = 1000): boolean {
  return a.path === b.path && a.author !== b.author && Math.abs(a.timestamp - b.timestamp) < thresholdMs;
}
