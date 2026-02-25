import { describe, it, expect } from "vitest";
import { buildFileTree } from "@/lib/utils/buildFileTree";

describe("buildFileTree", () => {
  it("returns root node for empty input", () => {
    const tree = buildFileTree([]);
    expect(tree.type).toBe("folder");
    expect(tree.children).toEqual([]);
  });

  it("creates a file at root level", () => {
    const tree = buildFileTree([{ path: "index.ts", content: "code" }]);
    expect(tree.children!.length).toBe(1);
    expect(tree.children![0].name).toBe("index.ts");
    expect(tree.children![0].type).toBe("file");
  });

  it("creates nested file structure", () => {
    const tree = buildFileTree([
      { path: "src/app/page.tsx", content: "page" },
    ]);
    const src = tree.children!.find((c) => c.name === "src");
    expect(src).toBeDefined();
    expect(src!.type).toBe("folder");
    const app = src!.children!.find((c) => c.name === "app");
    expect(app).toBeDefined();
  });

  it("groups files in same folder", () => {
    const tree = buildFileTree([
      { path: "src/a.ts", content: "a" },
      { path: "src/b.ts", content: "b" },
    ]);
    const src = tree.children!.find((c) => c.name === "src");
    expect(src!.children!.length).toBe(2);
  });

  it("assigns correct paths", () => {
    const tree = buildFileTree([{ path: "lib/utils.ts", content: "utils" }]);
    const lib = tree.children!.find((c) => c.name === "lib");
    const file = lib!.children!.find((c) => c.name === "utils.ts");
    expect(file!.path).toBe("lib/utils.ts");
  });
});
