/**
 * In-memory comment system for components/pages.
 */

export interface Comment {
  id: string;
  roomId: string;
  targetId: string; // component or page id
  author: string;
  authorName: string;
  content: string;
  createdAt: number;
  resolved: boolean;
  parentId?: string;
}

const comments = new Map<string, Comment[]>();

function key(roomId: string, targetId: string): string {
  return `${roomId}:${targetId}`;
}

export function addComment(comment: Comment): void {
  const k = key(comment.roomId, comment.targetId);
  const list = comments.get(k) ?? [];
  list.push(comment);
  comments.set(k, list);
}

export function getComments(roomId: string, targetId: string): Comment[] {
  return comments.get(key(roomId, targetId)) ?? [];
}

export function resolveComment(roomId: string, targetId: string, commentId: string): boolean {
  const list = comments.get(key(roomId, targetId));
  if (!list) return false;
  const comment = list.find((c) => c.id === commentId);
  if (comment) {
    comment.resolved = true;
    return true;
  }
  return false;
}

export function deleteComment(roomId: string, targetId: string, commentId: string): boolean {
  const k = key(roomId, targetId);
  const list = comments.get(k);
  if (!list) return false;
  const idx = list.findIndex((c) => c.id === commentId);
  if (idx >= 0) {
    list.splice(idx, 1);
    return true;
  }
  return false;
}

export function getAllCommentsForRoom(roomId: string): Comment[] {
  const result: Comment[] = [];
  for (const [k, list] of comments) {
    if (k.startsWith(`${roomId}:`)) {
      result.push(...list);
    }
  }
  return result;
}
