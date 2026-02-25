import { describe, it, expect } from "vitest";
import { vfsToSandpack } from "@/lib/fs/vfsToSandpack";
import type { FileNode } from "@/lib/fs/virtualFs";

describe("vfsToSandpack", () => {
  it("converts a single file", () => {
    const node: FileNode = {
      name: "index.ts",
      type: "file",
      content: "hello",
      path: "index.ts",
    };
    const result = vfsToSandpack(node);
    expect(result["/index.ts"]).toBe("hello");
  });

  it("converts a folder with children", () => {
    const node: FileNode = {
      name: "root",
      type: "folder",
      path: "root",
      children: [
        { name: "a.ts", type: "file", content: "a code", path: "root/a.ts" },
        { name: "b.ts", type: "file", content: "b code", path: "root/b.ts" },
      ],
    };
    const result = vfsToSandpack(node);
    expect(result["/root/a.ts"]).toBe("a code");
    expect(result["/root/b.ts"]).toBe("b code");
  });

  it("uses empty string for files without content", () => {
    const node: FileNode = {
      name: "empty.ts",
      type: "file",
      path: "empty.ts",
    };
    const result = vfsToSandpack(node);
    expect(result["/empty.ts"]).toBe("");
  });

  it("handles nested folders", () => {
    const node: FileNode = {
      name: "root",
      type: "folder",
      path: "root",
      children: [
        {
          name: "src",
          type: "folder",
          path: "root/src",
          children: [
            { name: "app.ts", type: "file", content: "app", path: "root/src/app.ts" },
          ],
        },
      ],
    };
    const result = vfsToSandpack(node);
    expect(result["/root/src/app.ts"]).toBe("app");
  });
});
