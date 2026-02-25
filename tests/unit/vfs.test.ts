import { describe, it, expect } from "vitest";
import { createFile, createFolder, updateFile, deleteNode, renameNode, type VFS } from "@/lib/vfs";

describe("VFS", () => {
  const emptyVfs: VFS = {};

  describe("createFile", () => {
    it("creates a file with content", () => {
      const vfs = createFile(emptyVfs, "index.ts", "console.log('hello')");
      expect(vfs["index.ts"]).toBeDefined();
      expect(vfs["index.ts"].type).toBe("file");
      expect(vfs["index.ts"].content).toBe("console.log('hello')");
    });

    it("creates a file with empty content by default", () => {
      const vfs = createFile(emptyVfs, "empty.ts");
      expect(vfs["empty.ts"].content).toBe("");
    });

    it("detects javascript language", () => {
      const vfs = createFile(emptyVfs, "app.js");
      expect(vfs["app.js"].language).toBe("javascript");
    });

    it("detects typescript language", () => {
      const vfs = createFile(emptyVfs, "app.tsx");
      expect(vfs["app.tsx"].language).toBe("typescript");
    });

    it("detects css language", () => {
      const vfs = createFile(emptyVfs, "style.css");
      expect(vfs["style.css"].language).toBe("css");
    });

    it("detects html language", () => {
      const vfs = createFile(emptyVfs, "index.html");
      expect(vfs["index.html"].language).toBe("html");
    });

    it("defaults to plaintext for unknown extensions", () => {
      const vfs = createFile(emptyVfs, "README.md");
      expect(vfs["README.md"].language).toBe("plaintext");
    });
  });

  describe("createFolder", () => {
    it("creates a folder node", () => {
      const vfs = createFolder(emptyVfs, "src");
      expect(vfs["src"]).toBeDefined();
      expect(vfs["src"].type).toBe("folder");
      expect(vfs["src"].children).toEqual([]);
    });
  });

  describe("updateFile", () => {
    it("updates file content", () => {
      const vfs = createFile(emptyVfs, "index.ts", "old content");
      const updated = updateFile(vfs, "index.ts", "new content");
      expect(updated["index.ts"].content).toBe("new content");
    });

    it("preserves other properties", () => {
      const vfs = createFile(emptyVfs, "app.js", "code");
      const updated = updateFile(vfs, "app.js", "new code");
      expect(updated["app.js"].language).toBe("javascript");
      expect(updated["app.js"].name).toBe("app.js");
    });
  });

  describe("deleteNode", () => {
    it("removes a file from VFS", () => {
      const vfs = createFile(emptyVfs, "temp.ts", "code");
      const after = deleteNode(vfs, "temp.ts");
      expect(after["temp.ts"]).toBeUndefined();
    });

    it("does not affect other files", () => {
      let vfs = createFile(emptyVfs, "a.ts", "a");
      vfs = createFile(vfs, "b.ts", "b");
      const after = deleteNode(vfs, "a.ts");
      expect(after["b.ts"]).toBeDefined();
    });
  });

  describe("renameNode", () => {
    it("renames a file", () => {
      const vfs = createFile(emptyVfs, "old.ts", "code");
      const after = renameNode(vfs, "old.ts", "new.ts");
      expect(after["new.ts"]).toBeDefined();
      expect(after["old.ts"]).toBeUndefined();
    });

    it("updates the name property on rename", () => {
      const vfs = createFile(emptyVfs, "src/old.ts", "code");
      const after = renameNode(vfs, "src/old.ts", "src/new.ts");
      expect(after["src/new.ts"].name).toBe("new.ts");
    });

    it("preserves content on rename", () => {
      const vfs = createFile(emptyVfs, "a.ts", "my code");
      const after = renameNode(vfs, "a.ts", "b.ts");
      expect(after["b.ts"].content).toBe("my code");
    });
  });
});
