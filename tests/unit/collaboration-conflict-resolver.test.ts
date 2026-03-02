import { describe, it, expect } from "vitest";
import { resolveConflict, hasConflict, type Edit } from "@/lib/collaboration/conflict-resolver";

describe("collaboration/conflict-resolver", () => {
  it("resolves to the latest edit", () => {
    const edits: Edit[] = [
      { path: "a.tsx", content: "old", timestamp: 100, author: "u1" },
      { path: "a.tsx", content: "new", timestamp: 200, author: "u2" },
    ];
    const winner = resolveConflict(edits);
    expect(winner?.content).toBe("new");
    expect(winner?.author).toBe("u2");
  });

  it("returns null for empty array", () => {
    expect(resolveConflict([])).toBeNull();
  });

  it("detects conflict for same path, different authors, close timestamps", () => {
    const a: Edit = { path: "file.tsx", content: "a", timestamp: 1000, author: "u1" };
    const b: Edit = { path: "file.tsx", content: "b", timestamp: 1500, author: "u2" };
    expect(hasConflict(a, b)).toBe(true);
  });

  it("does not flag conflict for different paths", () => {
    const a: Edit = { path: "a.tsx", content: "a", timestamp: 1000, author: "u1" };
    const b: Edit = { path: "b.tsx", content: "b", timestamp: 1000, author: "u2" };
    expect(hasConflict(a, b)).toBe(false);
  });

  it("does not flag conflict for same author", () => {
    const a: Edit = { path: "a.tsx", content: "v1", timestamp: 1000, author: "u1" };
    const b: Edit = { path: "a.tsx", content: "v2", timestamp: 1100, author: "u1" };
    expect(hasConflict(a, b)).toBe(false);
  });
});
