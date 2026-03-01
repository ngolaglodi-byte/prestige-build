import { describe, it, expect } from "vitest";
import {
  filesToFileSystemTree,
  detectDevCommand,
  isWebContainerSupported,
} from "@/lib/preview/webcontainer";

describe("filesToFileSystemTree", () => {
  it("converts a flat file map to a nested tree", () => {
    const files = {
      "package.json": { content: '{"name":"test"}' },
      "src/index.ts": { content: 'console.log("hello")' },
      "src/utils/helper.ts": { content: "export const x = 1;" },
    };

    const tree = filesToFileSystemTree(files);

    expect(tree["package.json"]).toEqual({
      file: { contents: '{"name":"test"}' },
    });
    expect(tree["src"]).toHaveProperty("directory");

    const srcDir = (tree["src"] as { directory: Record<string, unknown> })
      .directory;
    expect(srcDir["index.ts"]).toEqual({
      file: { contents: 'console.log("hello")' },
    });

    const utilsDir = (srcDir["utils"] as { directory: Record<string, unknown> })
      .directory;
    expect(utilsDir["helper.ts"]).toEqual({
      file: { contents: "export const x = 1;" },
    });
  });

  it("handles root-level files with leading slash", () => {
    const files = {
      "/index.html": { content: "<html></html>" },
    };

    const tree = filesToFileSystemTree(files);
    expect(tree["index.html"]).toEqual({
      file: { contents: "<html></html>" },
    });
  });

  it("returns empty tree for empty input", () => {
    expect(filesToFileSystemTree({})).toEqual({});
  });

  it("handles deeply nested paths", () => {
    const files = {
      "a/b/c/d/file.txt": { content: "deep" },
    };

    const tree = filesToFileSystemTree(files);
    const a = tree["a"] as { directory: Record<string, unknown> };
    const b = a.directory["b"] as { directory: Record<string, unknown> };
    const c = b.directory["c"] as { directory: Record<string, unknown> };
    const d = c.directory["d"] as { directory: Record<string, unknown> };
    expect(d.directory["file.txt"]).toEqual({ file: { contents: "deep" } });
  });
});

describe("detectDevCommand", () => {
  it("returns 'npm run dev' when scripts.dev exists", () => {
    const pkg = JSON.stringify({ scripts: { dev: "next dev" } });
    expect(detectDevCommand(pkg)).toBe("npm run dev");
  });

  it("returns 'npm run start' when only scripts.start exists", () => {
    const pkg = JSON.stringify({ scripts: { start: "node server.js" } });
    expect(detectDevCommand(pkg)).toBe("npm run start");
  });

  it("returns 'npm run serve' when only scripts.serve exists", () => {
    const pkg = JSON.stringify({ scripts: { serve: "vue-cli-service serve" } });
    expect(detectDevCommand(pkg)).toBe("npm run serve");
  });

  it("prefers dev over start", () => {
    const pkg = JSON.stringify({
      scripts: { dev: "next dev", start: "next start" },
    });
    expect(detectDevCommand(pkg)).toBe("npm run dev");
  });

  it("returns default 'npm run dev' for invalid JSON", () => {
    expect(detectDevCommand("not json")).toBe("npm run dev");
  });

  it("returns default 'npm run dev' for empty object", () => {
    expect(detectDevCommand("{}")).toBe("npm run dev");
  });
});

describe("isWebContainerSupported", () => {
  it("returns false in Node.js environment (no window)", () => {
    expect(isWebContainerSupported()).toBe(false);
  });
});
