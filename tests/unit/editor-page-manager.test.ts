import { describe, it, expect } from "vitest";
import {
  createPage,
  renamePage,
  deletePage,
  updatePageTree,
} from "@/lib/editor/page-manager";
import type { CanvasNode } from "@/lib/editor/drag-drop-engine";

describe("page-manager", () => {
  it("createPage generates a page with slug path", () => {
    const page = createPage("Home Page");
    expect(page.name).toBe("Home Page");
    expect(page.path).toBe("/home-page");
    expect(page.tree).toEqual([]);
    expect(page.id).toBeTruthy();
  });

  it("createPage sanitizes special characters in slug", () => {
    const page = createPage("Hello World!!!");
    expect(page.path).toBe("/hello-world");
  });

  it("renamePage updates the name of the matching page", () => {
    const page = createPage("Old Name");
    const pages = [page];
    const updated = renamePage(pages, page.id, "New Name");
    expect(updated[0].name).toBe("New Name");
  });

  it("renamePage does not modify other pages", () => {
    const p1 = createPage("Page 1");
    const p2 = createPage("Page 2");
    const updated = renamePage([p1, p2], p1.id, "Updated");
    expect(updated[1].name).toBe("Page 2");
  });

  it("deletePage removes the page by id", () => {
    const p1 = createPage("A");
    const p2 = createPage("B");
    const result = deletePage([p1, p2], p1.id);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(p2.id);
  });

  it("updatePageTree replaces tree for matching page", () => {
    const page = createPage("Test");
    const newTree: CanvasNode[] = [
      { id: "n1", componentId: "heading", props: {}, classes: "", children: [] },
    ];
    const result = updatePageTree([page], page.id, newTree);
    expect(result[0].tree).toHaveLength(1);
    expect(result[0].tree[0].id).toBe("n1");
  });

  it("updatePageTree does not affect other pages", () => {
    const p1 = createPage("P1");
    const p2 = createPage("P2");
    const result = updatePageTree([p1, p2], p1.id, [
      { id: "x", componentId: "c", props: {}, classes: "", children: [] },
    ]);
    expect(result[1].tree).toEqual([]);
  });
});
