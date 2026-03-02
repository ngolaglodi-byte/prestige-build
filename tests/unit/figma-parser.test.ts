import { describe, it, expect } from "vitest";
import { parseFigmaFile } from "@/lib/figma/parser";

describe("figma parser", () => {
  it("parses an empty document", () => {
    const tree = parseFigmaFile("key1", { document: {} });
    expect(tree.fileKey).toBe("key1");
    expect(tree.pages).toEqual([]);
    expect(tree.components).toEqual({});
  });

  it("parses file name", () => {
    const tree = parseFigmaFile("key2", { name: "My Design", document: {} });
    expect(tree.fileName).toBe("My Design");
  });

  it("parses pages with children", () => {
    const raw = {
      document: {
        children: [
          {
            id: "page1",
            name: "Home",
            children: [
              {
                id: "frame1",
                name: "Hero",
                type: "FRAME",
                fills: [],
                children: [],
              },
            ],
          },
        ],
      },
    };
    const tree = parseFigmaFile("key3", raw);
    expect(tree.pages).toHaveLength(1);
    expect(tree.pages[0].name).toBe("Home");
    expect(tree.pages[0].children).toHaveLength(1);
    expect(tree.pages[0].children[0].name).toBe("Hero");
  });

  it("parses node fills", () => {
    const raw = {
      document: {
        children: [
          {
            id: "p1",
            name: "Page",
            children: [
              {
                id: "n1",
                name: "Box",
                type: "FRAME",
                fills: [{ type: "SOLID", color: { r: 1, g: 0, b: 0, a: 1 } }],
              },
            ],
          },
        ],
      },
    };
    const tree = parseFigmaFile("key4", raw);
    const node = tree.pages[0].children[0];
    expect(node.fills).toHaveLength(1);
    expect(node.fills[0].type).toBe("SOLID");
    expect(node.fills[0].color?.r).toBe(1);
  });

  it("parses text style", () => {
    const raw = {
      document: {
        children: [
          {
            id: "p1",
            name: "Page",
            children: [
              {
                id: "t1",
                name: "Title",
                type: "TEXT",
                characters: "Hello",
                style: { fontFamily: "Inter", fontSize: 24, fontWeight: 700 },
                fills: [],
              },
            ],
          },
        ],
      },
    };
    const tree = parseFigmaFile("key5", raw);
    const node = tree.pages[0].children[0];
    expect(node.characters).toBe("Hello");
    expect(node.textStyle?.fontFamily).toBe("Inter");
    expect(node.textStyle?.fontSize).toBe(24);
  });

  it("marks COMPONENT nodes as isComponent", () => {
    const raw = {
      document: {
        children: [
          {
            id: "p1",
            name: "Page",
            children: [{ id: "c1", name: "Button", type: "COMPONENT", fills: [] }],
          },
        ],
      },
    };
    const tree = parseFigmaFile("key6", raw);
    expect(tree.pages[0].children[0].isComponent).toBe(true);
  });

  it("parses components map", () => {
    const raw = {
      document: { children: [] },
      components: {
        comp1: { name: "Card" },
      },
    };
    const tree = parseFigmaFile("key7", raw);
    expect(tree.components["comp1"]).toBeDefined();
    expect(tree.components["comp1"].name).toBe("Card");
    expect(tree.components["comp1"].isComponent).toBe(true);
  });

  it("parses layout info including bounding box dimensions", () => {
    const raw = {
      document: {
        children: [
          {
            id: "p1",
            name: "Page",
            children: [
              {
                id: "f1",
                name: "Frame",
                type: "FRAME",
                fills: [],
                layoutMode: "HORIZONTAL",
                itemSpacing: 8,
                absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 100 },
              },
            ],
          },
        ],
      },
    };
    const tree = parseFigmaFile("key8", raw);
    const node = tree.pages[0].children[0];
    expect(node.layoutInfo.layoutMode).toBe("HORIZONTAL");
    expect(node.layoutInfo.width).toBe(200);
    expect(node.layoutInfo.height).toBe(100);
    expect(node.layoutInfo.itemSpacing).toBe(8);
  });
});
