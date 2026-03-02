import { describe, it, expect } from "vitest";
import {
  figmaToCode,
  sanitizeComponentName,
  rgbaToHex,
  nodeToTailwind,
} from "@/lib/figma/figmaToCode";
import type { DesignTree, DesignNode } from "@/lib/figma/parser";

function makeNode(overrides: Partial<DesignNode> = {}): DesignNode {
  return {
    id: "n1",
    name: "Frame",
    type: "FRAME",
    fills: [],
    opacity: 1,
    layoutInfo: {},
    children: [],
    isComponent: false,
    ...overrides,
  };
}

function makeTree(overrides: Partial<DesignTree> = {}): DesignTree {
  return {
    fileKey: "fk1",
    fileName: "Test File",
    pages: [],
    components: {},
    styles: {},
    ...overrides,
  };
}

describe("rgbaToHex", () => {
  it("converts opaque color to hex", () => {
    expect(rgbaToHex({ r: 1, g: 0, b: 0, a: 1 })).toBe("#ff0000");
  });

  it("converts semi-transparent color to hex with alpha", () => {
    const hex = rgbaToHex({ r: 0, g: 0, b: 0, a: 0.5 });
    expect(hex).toBe("#00000080");
  });

  it("converts white color", () => {
    expect(rgbaToHex({ r: 1, g: 1, b: 1, a: 1 })).toBe("#ffffff");
  });
});

describe("sanitizeComponentName", () => {
  it("replaces special chars with underscores", () => {
    expect(sanitizeComponentName("My Component!")).toBe("My_Component");
  });

  it("handles leading numbers", () => {
    expect(sanitizeComponentName("123abc")).toBe("abc");
  });

  it("returns Component for empty result", () => {
    expect(sanitizeComponentName("!!!")).toBe("Component");
  });

  it("collapses multiple underscores", () => {
    expect(sanitizeComponentName("a---b---c")).toBe("a_b_c");
  });
});

describe("nodeToTailwind", () => {
  it("generates flex-row for HORIZONTAL layout", () => {
    const node = makeNode({ layoutInfo: { layoutMode: "HORIZONTAL" } });
    expect(nodeToTailwind(node)).toContain("flex flex-row");
  });

  it("generates flex-col for VERTICAL layout", () => {
    const node = makeNode({ layoutInfo: { layoutMode: "VERTICAL" } });
    expect(nodeToTailwind(node)).toContain("flex flex-col");
  });

  it("generates padding classes", () => {
    const node = makeNode({
      layoutInfo: { paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 },
    });
    expect(nodeToTailwind(node)).toContain("p-4");
  });

  it("generates background from solid fill", () => {
    const node = makeNode({
      fills: [{ type: "SOLID", color: { r: 1, g: 0, b: 0, a: 1 } }],
    });
    expect(nodeToTailwind(node)).toContain("bg-[#ff0000]");
  });

  it("generates opacity class when < 1", () => {
    const node = makeNode({ opacity: 0.5 });
    expect(nodeToTailwind(node)).toContain("opacity-50");
  });

  it("generates text size classes from textStyle", () => {
    const node = makeNode({
      textStyle: { fontSize: 24, fontWeight: 700 },
    });
    const tw = nodeToTailwind(node);
    expect(tw).toContain("text-2xl");
    expect(tw).toContain("font-bold");
  });
});

describe("figmaToCode", () => {
  it("returns empty files for empty tree", () => {
    const result = figmaToCode(makeTree());
    expect(result.files).toEqual([]);
    expect(result.summary.components).toBe(0);
    expect(result.summary.pages).toBe(0);
  });

  it("generates component files from components map", () => {
    const tree = makeTree({
      components: {
        c1: makeNode({ name: "Button", isComponent: true }),
      },
    });
    const result = figmaToCode(tree);
    expect(result.files.length).toBeGreaterThanOrEqual(1);
    expect(result.files[0].path).toContain("components/figma/Button.tsx");
    expect(result.files[0].content).toContain("export function Button");
    expect(result.summary.components).toBe(1);
  });

  it("generates page files from FRAME children", () => {
    const tree = makeTree({
      pages: [
        {
          id: "p1",
          name: "Home",
          children: [makeNode({ name: "HeroSection", type: "FRAME" })],
        },
      ],
    });
    const result = figmaToCode(tree);
    const pageFile = result.files.find((f) => f.path.includes("page.tsx"));
    expect(pageFile).toBeDefined();
    expect(pageFile!.content).toContain("HeroSectionPage");
    expect(result.summary.pages).toBe(1);
  });

  it("generates design tokens CSS when styles exist", () => {
    const tree = makeTree({
      styles: {
        s1: { name: "Primary", color: { r: 0.4, g: 0.4, b: 1, a: 1 } },
      },
    });
    const result = figmaToCode(tree);
    const tokenFile = result.files.find((f) => f.path.includes("figma-tokens.css"));
    expect(tokenFile).toBeDefined();
    expect(tokenFile!.content).toContain(":root");
    expect(tokenFile!.content).toContain("--color-primary");
  });
});
