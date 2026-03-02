import { describe, it, expect } from "vitest";
import { extractFileKey } from "@/lib/figma/figma-client";
import { parseNode } from "@/lib/figma/node-parser";
import { mapTailwindClasses } from "@/lib/figma/tailwind-mapper";
import { convertNodeToComponent } from "@/lib/figma/react-converter";
import { extractAssets } from "@/lib/figma/asset-extractor";
import { analyzeLayout, layoutToTailwind } from "@/lib/figma/layout-analyzer";

describe("figma/figma-client", () => {
  it("extracts file key from standard URL", () => {
    expect(extractFileKey("https://www.figma.com/file/abc123/MyDesign")).toBe("abc123");
  });

  it("extracts file key from design URL", () => {
    expect(extractFileKey("https://www.figma.com/design/xyz789/Test")).toBe("xyz789");
  });

  it("returns null for invalid URL", () => {
    expect(extractFileKey("https://example.com")).toBeNull();
  });
});

describe("figma/node-parser", () => {
  it("parses a FRAME node", () => {
    const result = parseNode({
      id: "1:1",
      name: "Frame",
      type: "FRAME",
      absoluteBoundingBox: { x: 0, y: 0, width: 400, height: 300 },
      fills: [{ type: "SOLID", color: { r: 1, g: 0, b: 0, a: 1 } }],
      cornerRadius: 8,
    });
    expect(result.type).toBe("frame");
    expect(result.width).toBe(400);
    expect(result.fills[0].color).toBe("#ff0000");
  });

  it("parses a TEXT node with characters", () => {
    const result = parseNode({
      id: "2:1",
      name: "Title",
      type: "TEXT",
      characters: "Hello World",
      absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 32 },
    });
    expect(result.type).toBe("text");
    expect(result.text).toBe("Hello World");
  });
});

describe("figma/tailwind-mapper", () => {
  it("maps dimensions and background color", () => {
    const classes = mapTailwindClasses({
      id: "1",
      name: "Box",
      type: "rectangle",
      x: 0, y: 0, width: 200, height: 100,
      fills: [{ type: "SOLID", color: "#ff0000" }],
      opacity: 1,
      children: [],
    });
    expect(classes).toContain("w-[200px]");
    expect(classes).toContain("h-[100px]");
    expect(classes).toContain("bg-[#ff0000]");
  });

  it("maps border radius", () => {
    const classes = mapTailwindClasses({
      id: "1", name: "Rounded", type: "rectangle",
      x: 0, y: 0, width: 100, height: 100,
      fills: [], opacity: 1, children: [],
      cornerRadius: 16,
    });
    expect(classes).toContain("rounded-xl");
  });
});

describe("figma/react-converter", () => {
  it("converts a text node to a component", () => {
    const result = convertNodeToComponent({
      id: "1", name: "MyTitle", type: "text",
      x: 0, y: 0, width: 200, height: 32,
      text: "Hello",
      fills: [], opacity: 1, children: [],
    });
    expect(result.name).toBe("MyTitle");
    expect(result.code).toContain("Hello");
    expect(result.code).toContain("export default function");
  });
});

describe("figma/asset-extractor", () => {
  it("extracts image references", () => {
    const assets = extractAssets([
      {
        id: "1", name: "Photo", type: "image",
        x: 0, y: 0, width: 200, height: 200,
        fills: [{ type: "IMAGE", imageRef: "img_abc" }],
        opacity: 1, children: [],
      },
    ]);
    expect(assets).toHaveLength(1);
    expect(assets[0].imageRef).toBe("img_abc");
  });

  it("returns empty for nodes without images", () => {
    const assets = extractAssets([
      {
        id: "1", name: "Box", type: "rectangle",
        x: 0, y: 0, width: 100, height: 100,
        fills: [{ type: "SOLID", color: "#000" }],
        opacity: 1, children: [],
      },
    ]);
    expect(assets).toHaveLength(0);
  });
});

describe("figma/layout-analyzer", () => {
  it("detects flex row from auto-layout", () => {
    const layout = analyzeLayout({
      id: "1", name: "Row", type: "frame",
      x: 0, y: 0, width: 400, height: 100,
      fills: [], opacity: 1,
      layout: { mode: "row", gap: 16, padding: [8, 8, 8, 8], alignItems: "center", justifyContent: "flex-start" },
      children: [],
    });
    expect(layout.display).toBe("flex");
    expect(layout.direction).toBe("row");
  });

  it("converts layout to tailwind classes", () => {
    const tw = layoutToTailwind({ display: "flex", direction: "column", gap: 8, alignItems: "center" });
    expect(tw).toContain("flex");
    expect(tw).toContain("flex-col");
    expect(tw).toContain("items-center");
  });
});
