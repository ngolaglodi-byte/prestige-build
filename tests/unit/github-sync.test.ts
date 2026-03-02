import { describe, it, expect } from "vitest";
import {
  computeDiff,
  detectConflicts,
  resolveConflicts,
  applyDiff,
  type FileEntry,
} from "@/lib/github/sync";

describe("github/sync", () => {
  describe("computeDiff", () => {
    it("detects added files", () => {
      const local: FileEntry[] = [{ path: "a.ts", content: "a" }];
      const remote: FileEntry[] = [
        { path: "a.ts", content: "a" },
        { path: "b.ts", content: "b" },
      ];
      const diff = computeDiff(local, remote);
      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].path).toBe("b.ts");
    });

    it("detects modified files", () => {
      const local: FileEntry[] = [{ path: "a.ts", content: "old" }];
      const remote: FileEntry[] = [{ path: "a.ts", content: "new" }];
      const diff = computeDiff(local, remote);
      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].path).toBe("a.ts");
    });

    it("detects deleted files", () => {
      const local: FileEntry[] = [
        { path: "a.ts", content: "a" },
        { path: "b.ts", content: "b" },
      ];
      const remote: FileEntry[] = [{ path: "a.ts", content: "a" }];
      const diff = computeDiff(local, remote);
      expect(diff.deleted).toHaveLength(1);
      expect(diff.deleted[0]).toBe("b.ts");
    });

    it("returns empty diff for identical files", () => {
      const files: FileEntry[] = [{ path: "a.ts", content: "same" }];
      const diff = computeDiff(files, files);
      expect(diff.added).toHaveLength(0);
      expect(diff.modified).toHaveLength(0);
      expect(diff.deleted).toHaveLength(0);
    });
  });

  describe("detectConflicts", () => {
    it("detects conflict when both sides changed", () => {
      const base: FileEntry[] = [{ path: "a.ts", content: "original" }];
      const local: FileEntry[] = [{ path: "a.ts", content: "local change" }];
      const remote: FileEntry[] = [{ path: "a.ts", content: "remote change" }];
      const conflicts = detectConflicts(local, remote, base);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].path).toBe("a.ts");
    });

    it("does not flag if only one side changed", () => {
      const base: FileEntry[] = [{ path: "a.ts", content: "original" }];
      const local: FileEntry[] = [{ path: "a.ts", content: "local change" }];
      const remote: FileEntry[] = [{ path: "a.ts", content: "original" }];
      const conflicts = detectConflicts(local, remote, base);
      expect(conflicts).toHaveLength(0);
    });

    it("does not flag if both sides made identical changes", () => {
      const base: FileEntry[] = [{ path: "a.ts", content: "original" }];
      const local: FileEntry[] = [{ path: "a.ts", content: "same change" }];
      const remote: FileEntry[] = [{ path: "a.ts", content: "same change" }];
      const conflicts = detectConflicts(local, remote, base);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe("resolveConflicts", () => {
    it("resolves to local content", () => {
      const conflicts = [
        { path: "a.ts", localContent: "local", remoteContent: "remote" },
      ];
      const resolved = resolveConflicts(conflicts, "local");
      expect(resolved[0].content).toBe("local");
    });

    it("resolves to remote content", () => {
      const conflicts = [
        { path: "a.ts", localContent: "local", remoteContent: "remote" },
      ];
      const resolved = resolveConflicts(conflicts, "remote");
      expect(resolved[0].content).toBe("remote");
    });
  });

  describe("applyDiff", () => {
    it("applies additions, modifications, and deletions", () => {
      const local: FileEntry[] = [
        { path: "a.ts", content: "a" },
        { path: "b.ts", content: "old_b" },
        { path: "c.ts", content: "c" },
      ];
      const diff = {
        added: [{ path: "d.ts", content: "d" }],
        modified: [{ path: "b.ts", localContent: "old_b", remoteContent: "new_b" }],
        deleted: ["c.ts"],
      };
      const resolved = [{ path: "b.ts", content: "new_b" }];

      const result = applyDiff(local, diff, resolved);
      const paths = result.map((f) => f.path);

      expect(paths).toContain("a.ts");
      expect(paths).toContain("b.ts");
      expect(paths).toContain("d.ts");
      expect(paths).not.toContain("c.ts");

      const bFile = result.find((f) => f.path === "b.ts");
      expect(bFile?.content).toBe("new_b");
    });
  });
});
