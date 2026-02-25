import { describe, it, expect } from "vitest";
import { VirtualFileSystem } from "@/lib/fs/virtualFs";

describe("VirtualFileSystem", () => {
  it("starts with an empty root", () => {
    const vfs = new VirtualFileSystem();
    expect(vfs.root.name).toBe("root");
    expect(vfs.root.type).toBe("folder");
    expect(vfs.root.children).toEqual([]);
  });

  it("creates a folder", () => {
    const vfs = new VirtualFileSystem();
    vfs.createFolder("src");
    expect(vfs.root.children!.length).toBe(1);
    expect(vfs.root.children![0].name).toBe("src");
    expect(vfs.root.children![0].type).toBe("folder");
  });

  it("creates nested folders", () => {
    const vfs = new VirtualFileSystem();
    vfs.createFolder("src/components");
    expect(vfs.root.children![0].name).toBe("src");
    expect(vfs.root.children![0].children![0].name).toBe("components");
  });

  it("creates a file", () => {
    const vfs = new VirtualFileSystem();
    vfs.createFile("index.ts", "hello");
    const file = vfs.root.children!.find((c) => c.name === "index.ts");
    expect(file).toBeDefined();
    expect(file!.type).toBe("file");
    expect(file!.content).toBe("hello");
  });

  it("creates file in nested path", () => {
    const vfs = new VirtualFileSystem();
    vfs.createFile("src/app/page.tsx", "export default function Page() {}");
    const src = vfs.root.children!.find((c) => c.name === "src");
    expect(src).toBeDefined();
    const app = src!.children!.find((c) => c.name === "app");
    expect(app).toBeDefined();
    const page = app!.children!.find((c) => c.name === "page.tsx");
    expect(page).toBeDefined();
    expect(page!.content).toBe("export default function Page() {}");
  });

  it("creates file with empty content by default", () => {
    const vfs = new VirtualFileSystem();
    vfs.createFile("empty.ts");
    const file = vfs.root.children!.find((c) => c.name === "empty.ts");
    expect(file!.content).toBe("");
  });

  it("getTree returns the root node", () => {
    const vfs = new VirtualFileSystem();
    vfs.createFile("a.ts", "code");
    const tree = vfs.getTree();
    expect(tree.name).toBe("root");
    expect(tree.children!.length).toBe(1);
  });

  it("updates paths correctly", () => {
    const vfs = new VirtualFileSystem();
    vfs.createFile("src/index.ts", "code");
    const src = vfs.root.children!.find((c) => c.name === "src");
    expect(src!.path).toBe("root/src");
    const file = src!.children!.find((c) => c.name === "index.ts");
    expect(file!.path).toBe("root/src/index.ts");
  });
});
