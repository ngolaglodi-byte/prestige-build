/**
 * GitHub Sync — bidirectional synchronisation between
 * Prestige Build projects and GitHub repositories.
 *
 * Pure logic layer; does NOT touch the database directly so
 * it can be tested without mocking Drizzle.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncDirection = "push" | "pull" | "both";

export type SyncStatus =
  | "idle"
  | "syncing"
  | "success"
  | "conflict"
  | "error";

export interface SyncConfig {
  projectId: string;
  owner: string;
  repo: string;
  branch: string;
  direction: SyncDirection;
  githubToken: string;
  autoSync: boolean;
  lastSyncAt?: string;
  lastCommitSha?: string;
}

export interface SyncResult {
  status: SyncStatus;
  direction: SyncDirection;
  filesChanged: number;
  commitSha?: string;
  conflicts?: SyncConflict[];
  error?: string;
  syncedAt: string;
}

export interface SyncConflict {
  path: string;
  localContent: string;
  remoteContent: string;
}

export interface FileEntry {
  path: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Diff computation
// ---------------------------------------------------------------------------

export interface FileDiff {
  added: FileEntry[];
  modified: Array<{ path: string; localContent: string; remoteContent: string }>;
  deleted: string[];
}

/**
 * Computes differences between local and remote file sets.
 */
export function computeDiff(
  localFiles: FileEntry[],
  remoteFiles: FileEntry[]
): FileDiff {
  const localMap = new Map(localFiles.map((f) => [f.path, f.content]));
  const remoteMap = new Map(remoteFiles.map((f) => [f.path, f.content]));

  const added: FileEntry[] = [];
  const modified: FileDiff["modified"] = [];
  const deleted: string[] = [];

  // Files in remote not in local → added
  for (const [path, content] of remoteMap) {
    if (!localMap.has(path)) {
      added.push({ path, content });
    }
  }

  // Files in both but different → modified
  for (const [path, localContent] of localMap) {
    const remoteContent = remoteMap.get(path);
    if (remoteContent !== undefined && remoteContent !== localContent) {
      modified.push({ path, localContent, remoteContent });
    }
  }

  // Files in local not in remote → deleted
  for (const [path] of localMap) {
    if (!remoteMap.has(path)) {
      deleted.push(path);
    }
  }

  return { added, modified, deleted };
}

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

/**
 * Detects conflicts when both local and remote have changed
 * the same file since the last sync.
 */
export function detectConflicts(
  localFiles: FileEntry[],
  remoteFiles: FileEntry[],
  baseFiles: FileEntry[]
): SyncConflict[] {
  const baseMap = new Map(baseFiles.map((f) => [f.path, f.content]));
  const localMap = new Map(localFiles.map((f) => [f.path, f.content]));
  const remoteMap = new Map(remoteFiles.map((f) => [f.path, f.content]));

  const conflicts: SyncConflict[] = [];

  for (const [path, localContent] of localMap) {
    const remoteContent = remoteMap.get(path);
    const baseContent = baseMap.get(path);

    if (remoteContent === undefined) continue;

    const localChanged = localContent !== baseContent;
    const remoteChanged = remoteContent !== baseContent;

    if (localChanged && remoteChanged && localContent !== remoteContent) {
      conflicts.push({ path, localContent, remoteContent });
    }
  }

  return conflicts;
}

// ---------------------------------------------------------------------------
// Resolve — apply a sync result to produce a merged file set
// ---------------------------------------------------------------------------

export type ConflictResolution = "local" | "remote";

export function resolveConflicts(
  conflicts: SyncConflict[],
  resolution: ConflictResolution
): FileEntry[] {
  return conflicts.map((c) => ({
    path: c.path,
    content: resolution === "local" ? c.localContent : c.remoteContent,
  }));
}

// ---------------------------------------------------------------------------
// Merge — combines diff + resolved conflicts into final file set
// ---------------------------------------------------------------------------

export function applyDiff(
  localFiles: FileEntry[],
  diff: FileDiff,
  resolved: FileEntry[]
): FileEntry[] {
  const result = new Map(localFiles.map((f) => [f.path, f.content]));

  // Apply additions
  for (const file of diff.added) {
    result.set(file.path, file.content);
  }

  // Apply resolved conflicts / modifications
  for (const file of resolved) {
    result.set(file.path, file.content);
  }

  // Apply deletions
  for (const path of diff.deleted) {
    result.delete(path);
  }

  return Array.from(result.entries()).map(([path, content]) => ({
    path,
    content,
  }));
}
