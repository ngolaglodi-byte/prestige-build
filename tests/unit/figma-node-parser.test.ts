import { describe, it, expect } from "vitest";
import { parseNode, parseFileNodes } from "@/lib/figma/node-parser";

describe("node-parser – mapType coverage", () => {
  it("maps INSTANCE to frame", () => {
    const r = parseNode({ id: "1", name: "I", type: "INSTANCE" });
    expect(r.type).toBe("frame");
  });

  it("maps ELLIPSE to rectangle", () => {
    const r = parseNode({ id: "1", name: "E", type: "ELLIPSE" });
    expect(r.type).toBe("rectangle");
  });

  it("maps LINE to rectangle", () => {
    const r = parseNode({ id: "1", name: "L", type: "LINE" });
    expect(r.type).toBe("rectangle");
  });

  it("maps COMPONENT to component", () => {
    const r = parseNode({ id: "1", name: "C", type: "COMPONENT" });
    expect(r.type).toBe("component");
  });

  it("maps GROUP to group", () => {
    const r = parseNode({ id: "1", name: "G", type: "GROUP" });
    expect(r.type).toBe("group");
  });

  it("maps VECTOR to vector", () => {
    const r = parseNode({ id: "1", name: "V", type: "VECTOR" });
    expect(r.type).toBe("vector");
  });

  it("maps BOOLEAN_OPERATION to vector", () => {
    const r = parseNode({ id: "1", name: "B", type: "BOOLEAN_OPERATION" });
    expect(r.type).toBe("vector");
  });

  it("maps unknown type to other", () => {
    const r = parseNode({ id: "1", name: "X", type: "UNKNOWN_TYPE" });
    expect(r.type).toBe("other");
  });
});

describe("node-parser – mapLayout coverage", () => {
  it("returns undefined layout when layoutMode is NONE", () => {
    const r = parseNode({ id: "1", name: "N", type: "FRAME", layoutMode: "NONE" });
    expect(r.layout).toBeUndefined();
  });

  it("returns undefined layout when layoutMode is absent", () => {
    const r = parseNode({ id: "1", name: "N", type: "FRAME" });
    expect(r.layout).toBeUndefined();
  });

  it("maps HORIZONTAL layoutMode to row", () => {
    const r = parseNode({
      id: "1", name: "H", type: "FRAME",
      layoutMode: "HORIZONTAL", itemSpacing: 12,
      paddingTop: 4, paddingRight: 8, paddingBottom: 4, paddingLeft: 8,
      counterAxisAlignItems: "CENTER",
      primaryAxisAlignItems: "CENTER",
    });
    expect(r.layout).toBeDefined();
    expect(r.layout!.mode).toBe("row");
    expect(r.layout!.gap).toBe(12);
    expect(r.layout!.padding).toEqual([4, 8, 4, 8]);
    expect(r.layout!.alignItems).toBe("center");
    expect(r.layout!.justifyContent).toBe("center");
  });

  it("maps VERTICAL layoutMode to column with defaults", () => {
    const r = parseNode({
      id: "1", name: "V", type: "FRAME",
      layoutMode: "VERTICAL",
    });
    expect(r.layout).toBeDefined();
    expect(r.layout!.mode).toBe("column");
    expect(r.layout!.gap).toBe(0);
    expect(r.layout!.padding).toEqual([0, 0, 0, 0]);
    expect(r.layout!.alignItems).toBe("stretch");
    expect(r.layout!.justifyContent).toBe("flex-start");
  });
});

describe("node-parser – fill processing", () => {
  it("filters out invisible fills", () => {
    const r = parseNode({
      id: "1", name: "F", type: "RECTANGLE",
      fills: [
        { type: "SOLID", color: { r: 1, g: 0, b: 0, a: 1 }, visible: false },
        { type: "SOLID", color: { r: 0, g: 1, b: 0, a: 1 } },
      ],
    });
    expect(r.fills).toHaveLength(1);
    expect(r.fills[0].color).toBe("#00ff00");
  });

  it("handles semi-transparent colors", () => {
    const r = parseNode({
      id: "1", name: "T", type: "RECTANGLE",
      fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 0.5 } }],
    });
    expect(r.fills[0].color).toContain("#ffffff");
    expect(r.fills[0].color!.length).toBeGreaterThan(7); // has alpha
  });

  it("handles IMAGE fills with imageRef", () => {
    const r = parseNode({
      id: "1", name: "I", type: "RECTANGLE",
      fills: [{ type: "IMAGE", imageRef: "img_123" }],
    });
    expect(r.fills[0].type).toBe("IMAGE");
    expect(r.fills[0].imageRef).toBe("img_123");
  });
});

describe("node-parser – parseFileNodes", () => {
  it("parses all children of a document node", () => {
    const result = parseFileNodes({
      id: "0:0", name: "Document", type: "DOCUMENT",
      children: [
        { id: "1:1", name: "Page1", type: "FRAME" },
        { id: "1:2", name: "Page2", type: "FRAME" },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Page1");
    expect(result[1].name).toBe("Page2");
  });

  it("returns empty array for document without children", () => {
    const result = parseFileNodes({ id: "0:0", name: "Doc", type: "DOCUMENT" });
    expect(result).toEqual([]);
  });
});
