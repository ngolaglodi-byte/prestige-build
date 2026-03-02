import { describe, it, expect } from "vitest";
import {
  computeDiff,
  detectConflicts,
  resolveConflicts,
  applyDiff,
  type FileEntry,
  type FileDiff,
} from "@/lib/github/sync";

describe("github/sync – extended", () => {
  describe("computeDiff with mixed changes", () => {
    it("detects added, modified, and deleted files in one diff", () => {
      const local: FileEntry[] = [
        { path: "keep.ts", content: "same" },
        { path: "changed.ts", content: "old" },
        { path: "removed.ts", content: "gone" },
      ];
      const remote: FileEntry[] = [
        { path: "keep.ts", content: "same" },
        { path: "changed.ts", content: "new" },
        { path: "added.ts", content: "fresh" },
      ];
      const diff = computeDiff(local, remote);
      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].path).toBe("added.ts");
      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].path).toBe("changed.ts");
      expect(diff.deleted).toHaveLength(1);
      expect(diff.deleted[0]).toBe("removed.ts");
    });

    it("handles multiple added and multiple deleted files", () => {
      const local: FileEntry[] = [
        { path: "a.ts", content: "a" },
        { path: "b.ts", content: "b" },
      ];
      const remote: FileEntry[] = [
        { path: "c.ts", content: "c" },
        { path: "d.ts", content: "d" },
      ];
      const diff = computeDiff(local, remote);
      expect(diff.added).toHaveLength(2);
      expect(diff.deleted).toHaveLength(2);
      expect(diff.modified).toHaveLength(0);
    });
  });

  describe("detectConflicts with multiple conflicting files", () => {
    it("detects conflicts for all files changed on both sides", () => {
      const base: FileEntry[] = [
        { path: "a.ts", content: "orig_a" },
        { path: "b.ts", content: "orig_b" },
        { path: "c.ts", content: "orig_c" },
      ];
      const local: FileEntry[] = [
        { path: "a.ts", content: "local_a" },
        { path: "b.ts", content: "local_b" },
        { path: "c.ts", content: "orig_c" },
      ];
      const remote: FileEntry[] = [
        { path: "a.ts", content: "remote_a" },
        { path: "b.ts", content: "remote_b" },
        { path: "c.ts", content: "orig_c" },
      ];
      const conflicts = detectConflicts(local, remote, base);
      expect(conflicts).toHaveLength(2);
      expect(conflicts.map((c) => c.path).sort()).toEqual(["a.ts", "b.ts"]);
    });
  });

  describe("detectConflicts – local-only files", () => {
    it("does not flag files that exist only locally", () => {
      const base: FileEntry[] = [];
      const local: FileEntry[] = [{ path: "new.ts", content: "new" }];
      const remote: FileEntry[] = [];
      const conflicts = detectConflicts(local, remote, base);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe("detectConflicts – remote-only files", () => {
    it("does not flag files that exist only remotely", () => {
      const base: FileEntry[] = [];
      const local: FileEntry[] = [];
      const remote: FileEntry[] = [{ path: "remote.ts", content: "data" }];
      const conflicts = detectConflicts(local, remote, base);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe("applyDiff preserves unmodified files", () => {
    it("keeps files not mentioned in the diff", () => {
      const local: FileEntry[] = [
        { path: "untouched.ts", content: "original" },
        { path: "also-safe.ts", content: "safe" },
      ];
      const diff: FileDiff = { added: [], modified: [], deleted: [] };
      const result = applyDiff(local, diff, []);
      expect(result).toHaveLength(2);
      expect(result.find((f) => f.path === "untouched.ts")?.content).toBe("original");
      expect(result.find((f) => f.path === "also-safe.ts")?.content).toBe("safe");
    });
  });

  describe("resolveConflicts with empty array", () => {
    it("returns empty array for empty conflicts", () => {
      const resolved = resolveConflicts([], "local");
      expect(resolved).toHaveLength(0);
    });

    it("returns empty array for empty conflicts with remote strategy", () => {
      const resolved = resolveConflicts([], "remote");
      expect(resolved).toHaveLength(0);
    });
  });

  describe("full sync cycle", () => {
    it("compute diff → detect conflicts → resolve → apply", () => {
      const base: FileEntry[] = [
        { path: "shared.ts", content: "v1" },
        { path: "stable.ts", content: "ok" },
      ];
      const local: FileEntry[] = [
        { path: "shared.ts", content: "local_v2" },
        { path: "stable.ts", content: "ok" },
        { path: "local-only.ts", content: "mine" },
      ];
      const remote: FileEntry[] = [
        { path: "shared.ts", content: "remote_v2" },
        { path: "stable.ts", content: "ok" },
        { path: "remote-new.ts", content: "theirs" },
      ];

      // Step 1: compute diff (local vs remote)
      const diff = computeDiff(local, remote);
      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].path).toBe("remote-new.ts");
      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].path).toBe("shared.ts");
      expect(diff.deleted).toHaveLength(1);
      expect(diff.deleted[0]).toBe("local-only.ts");

      // Step 2: detect conflicts
      const conflicts = detectConflicts(local, remote, base);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].path).toBe("shared.ts");

      // Step 3: resolve (pick remote)
      const resolved = resolveConflicts(conflicts, "remote");
      expect(resolved).toHaveLength(1);
      expect(resolved[0].content).toBe("remote_v2");

      // Step 4: apply diff
      const final = applyDiff(local, diff, resolved);
      const paths = final.map((f) => f.path);
      expect(paths).toContain("shared.ts");
      expect(paths).toContain("stable.ts");
      expect(paths).toContain("remote-new.ts");
      expect(paths).not.toContain("local-only.ts");
      expect(final.find((f) => f.path === "shared.ts")?.content).toBe("remote_v2");
    });
  });
});
