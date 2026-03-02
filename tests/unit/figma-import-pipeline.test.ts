import { describe, it, expect } from "vitest";
import {
  figmaToCode,
  nodeToTailwind,
  sanitizeComponentName,
} from "@/lib/figma/figmaToCode";
import { parseFigmaFile } from "@/lib/figma/parser";
import type { DesignNode, DesignTree } from "@/lib/figma/parser";

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

describe("figma import pipeline – multiple frames", () => {
  it("imports a design with multiple frames across pages", () => {
    const result = figmaToCode(
      makeTree({
        pages: [
          {
            id: "p1",
            name: "Home",
            children: [
              makeNode({ id: "f1", name: "Hero", type: "FRAME" }),
              makeNode({ id: "f2", name: "Footer", type: "FRAME" }),
            ],
          },
          {
            id: "p2",
            name: "About",
            children: [
              makeNode({ id: "f3", name: "AboutSection", type: "FRAME" }),
            ],
          },
        ],
      })
    );
    expect(result.summary.pages).toBe(3);
    expect(result.files.filter((f) => f.path.includes("page.tsx"))).toHaveLength(3);
  });

  it("generates separate page files for each frame", () => {
    const result = figmaToCode(
      makeTree({
        pages: [
          {
            id: "p1",
            name: "Page",
            children: [
              makeNode({ id: "f1", name: "Dashboard", type: "FRAME" }),
              makeNode({ id: "f2", name: "Settings", type: "FRAME" }),
            ],
          },
        ],
      })
    );
    const pagePaths = result.files
      .filter((f) => f.path.includes("page.tsx"))
      .map((f) => f.path);
    expect(pagePaths.some((p) => p.includes("dashboard"))).toBe(true);
    expect(pagePaths.some((p) => p.includes("settings"))).toBe(true);
  });
});

describe("figma import pipeline – nested components", () => {
  it("handles deeply nested children", () => {
    const nested = makeNode({
      id: "f1",
      name: "Outer",
      type: "FRAME",
      children: [
        makeNode({
          id: "f2",
          name: "Inner",
          children: [
            makeNode({ id: "f3", name: "Leaf", type: "TEXT", characters: "Hello" }),
          ],
        }),
      ],
    });
    const result = figmaToCode(
      makeTree({ pages: [{ id: "p1", name: "Page", children: [nested] }] })
    );
    const pageFile = result.files.find((f) => f.path.includes("page.tsx"));
    expect(pageFile).toBeDefined();
    expect(pageFile!.content).toContain("Hello");
  });

  it("generates component files for entries in components map", () => {
    const result = figmaToCode(
      makeTree({
        components: {
          c1: makeNode({ id: "c1", name: "Button", type: "COMPONENT", isComponent: true }),
          c2: makeNode({ id: "c2", name: "Card", type: "COMPONENT", isComponent: true }),
        },
      })
    );
    expect(result.summary.components).toBe(2);
    expect(result.files.some((f) => f.path.includes("Button.tsx"))).toBe(true);
    expect(result.files.some((f) => f.path.includes("Card.tsx"))).toBe(true);
  });
});

describe("figma import pipeline – error handling for invalid data", () => {
  it("handles empty tree gracefully", () => {
    const result = figmaToCode(makeTree());
    expect(result.files).toHaveLength(0);
    expect(result.summary.pages).toBe(0);
    expect(result.summary.components).toBe(0);
  });

  it("handles pages with no children", () => {
    const result = figmaToCode(
      makeTree({ pages: [{ id: "p1", name: "Empty", children: [] }] })
    );
    expect(result.summary.pages).toBe(0);
  });

  it("parseFigmaFile handles missing document", () => {
    const tree = parseFigmaFile("fk", {});
    expect(tree.pages).toHaveLength(0);
    expect(tree.fileKey).toBe("fk");
  });

  it("parseFigmaFile handles missing children in pages", () => {
    const tree = parseFigmaFile("fk", {
      document: { children: [{ id: "p1", name: "Page" }] },
    });
    expect(tree.pages).toHaveLength(1);
    expect(tree.pages[0].children).toHaveLength(0);
  });
});

describe("figma import pipeline – responsive / layout mappings", () => {
  it("maps HORIZONTAL layout to flex flex-row", () => {
    const tw = nodeToTailwind(
      makeNode({ layoutInfo: { layoutMode: "HORIZONTAL" } })
    );
    expect(tw).toContain("flex");
    expect(tw).toContain("flex-row");
  });

  it("maps VERTICAL layout to flex flex-col", () => {
    const tw = nodeToTailwind(
      makeNode({ layoutInfo: { layoutMode: "VERTICAL" } })
    );
    expect(tw).toContain("flex");
    expect(tw).toContain("flex-col");
  });

  it("maps itemSpacing to gap utility", () => {
    const tw = nodeToTailwind(
      makeNode({ layoutInfo: { itemSpacing: 16 } })
    );
    expect(tw).toContain("gap-4");
  });

  it("maps width and height to arbitrary values", () => {
    const tw = nodeToTailwind(
      makeNode({ layoutInfo: { width: 320, height: 200 } })
    );
    expect(tw).toContain("w-[320px]");
    expect(tw).toContain("h-[200px]");
  });
});

describe("figma import pipeline – design token extraction", () => {
  it("extracts named color tokens", () => {
    const result = figmaToCode(
      makeTree({
        styles: {
          s1: { name: "Primary", color: { r: 0.2, g: 0.4, b: 0.8, a: 1 } },
          s2: { name: "Secondary", color: { r: 1, g: 0, b: 0, a: 1 } },
        },
      })
    );
    const tokenFile = result.files.find((f) => f.path.includes("figma-tokens.css"));
    expect(tokenFile).toBeDefined();
    expect(tokenFile!.content).toContain("--color-primary");
    expect(tokenFile!.content).toContain("--color-secondary");
  });

  it("generates no token file when styles are empty", () => {
    const result = figmaToCode(makeTree({ styles: {} }));
    const tokenFile = result.files.find((f) => f.path.includes("figma-tokens.css"));
    expect(tokenFile).toBeUndefined();
  });

  it("token ids are included in summary", () => {
    const result = figmaToCode(
      makeTree({
        styles: {
          s1: { name: "Brand", color: { r: 0, g: 0, b: 0, a: 1 } },
        },
      })
    );
    expect(result.summary.tokens).toContain("s1");
  });
});

describe("figma import pipeline – component matching", () => {
  it("sanitizeComponentName cleans special characters", () => {
    expect(sanitizeComponentName("My Component!")).toBe("My_Component");
  });

  it("sanitizeComponentName strips leading numbers", () => {
    // Leading digits → "_", collapsed underscores "_+" → "_", then leading/trailing "_" stripped
    const result = sanitizeComponentName("123Widget");
    expect(result).toBe("Widget");
  });

  it("sanitizeComponentName returns Component for empty string", () => {
    expect(sanitizeComponentName("")).toBe("Component");
  });

  it("COMPONENT type nodes are recognized as component files", () => {
    const result = figmaToCode(
      makeTree({
        components: {
          c1: makeNode({ id: "c1", name: "NavBar", type: "COMPONENT", isComponent: true }),
        },
      })
    );
    expect(result.files.some((f) => f.path.startsWith("components/figma/"))).toBe(true);
  });

  it("FRAME children in pages are generated as page files", () => {
    const result = figmaToCode(
      makeTree({
        pages: [
          {
            id: "p1",
            name: "Page",
            children: [makeNode({ name: "Landing", type: "FRAME" })],
          },
        ],
      })
    );
    expect(result.files.some((f) => f.path.includes("app/(generated)/"))).toBe(true);
  });
});
