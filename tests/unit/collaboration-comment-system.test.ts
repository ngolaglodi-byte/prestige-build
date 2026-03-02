import { describe, it, expect, beforeEach } from "vitest";
import {
  addComment,
  getComments,
  resolveComment,
  deleteComment,
  getAllCommentsForRoom,
  type Comment,
} from "@/lib/collaboration/comment-system";

function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "c1",
    roomId: "room1",
    targetId: "target1",
    author: "user1",
    authorName: "Alice",
    content: "Test comment",
    createdAt: Date.now(),
    resolved: false,
    ...overrides,
  };
}

describe("comment-system", () => {
  // The module uses a shared Map; tests add unique keys to avoid conflicts.
  const roomId = `room_${Date.now()}`;
  const targetId = "comp1";

  it("addComment and getComments works", () => {
    const comment = makeComment({ id: "cs1", roomId, targetId });
    addComment(comment);
    const result = getComments(roomId, targetId);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Test comment");
  });

  it("getComments returns empty for unknown target", () => {
    const result = getComments(roomId, "nonexistent");
    expect(result).toEqual([]);
  });

  it("resolveComment marks comment as resolved", () => {
    const comment = makeComment({ id: "cs2", roomId, targetId: "t2" });
    addComment(comment);
    const resolved = resolveComment(roomId, "t2", "cs2");
    expect(resolved).toBe(true);
    const comments = getComments(roomId, "t2");
    expect(comments[0].resolved).toBe(true);
  });

  it("resolveComment returns false for unknown comment", () => {
    expect(resolveComment(roomId, targetId, "unknown")).toBe(false);
  });

  it("resolveComment returns false for unknown room/target", () => {
    expect(resolveComment("noroom", "notarget", "noid")).toBe(false);
  });

  it("deleteComment removes the comment", () => {
    const comment = makeComment({ id: "cs3", roomId, targetId: "t3" });
    addComment(comment);
    const deleted = deleteComment(roomId, "t3", "cs3");
    expect(deleted).toBe(true);
    expect(getComments(roomId, "t3")).toHaveLength(0);
  });

  it("deleteComment returns false for unknown comment", () => {
    expect(deleteComment(roomId, targetId, "unknown")).toBe(false);
  });

  it("getAllCommentsForRoom returns all comments across targets", () => {
    const r = `allroom_${Date.now()}`;
    addComment(makeComment({ id: "a1", roomId: r, targetId: "x1" }));
    addComment(makeComment({ id: "a2", roomId: r, targetId: "x2" }));
    const all = getAllCommentsForRoom(r);
    expect(all).toHaveLength(2);
  });
});
