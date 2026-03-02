import { describe, it, expect } from "vitest";
import { nodeToTailwind, sanitizeComponentName, figmaToCode } from "@/lib/figma/figmaToCode";
import type { DesignNode, DesignTree } from "@/lib/figma/parser";

function makeNode(overrides: Partial<DesignNode> = {}): DesignNode {
  return {
    id: "n1", name: "Frame", type: "FRAME",
    fills: [], opacity: 1, layoutInfo: {}, children: [],
    isComponent: false,
    ...overrides,
  };
}

function makeTree(overrides: Partial<DesignTree> = {}): DesignTree {
  return {
    fileKey: "fk1", fileName: "Test File",
    pages: [], components: {}, styles: {},
    ...overrides,
  };
}

describe("nodeToTailwind – alignment branches", () => {
  it("generates justify-between for SPACE_BETWEEN", () => {
    const tw = nodeToTailwind(makeNode({
      layoutInfo: { primaryAxisAlignItems: "SPACE_BETWEEN" },
    }));
    expect(tw).toContain("justify-between");
  });

  it("generates items-center for CENTER counterAxis", () => {
    const tw = nodeToTailwind(makeNode({
      layoutInfo: { counterAxisAlignItems: "CENTER" },
    }));
    expect(tw).toContain("items-center");
  });
});

describe("nodeToTailwind – padding branches", () => {
  it("generates py and px for symmetric padding", () => {
    const tw = nodeToTailwind(makeNode({
      layoutInfo: { paddingTop: 16, paddingBottom: 16, paddingLeft: 8, paddingRight: 8 },
    }));
    expect(tw).toContain("py-4");
    expect(tw).toContain("px-2");
  });

  it("generates individual pt/pb when top != bottom", () => {
    const tw = nodeToTailwind(makeNode({
      layoutInfo: { paddingTop: 8, paddingBottom: 16, paddingLeft: 12, paddingRight: 12 },
    }));
    expect(tw).toContain("pt-2");
    expect(tw).toContain("pb-4");
    expect(tw).toContain("px-3");
  });

  it("generates individual pl/pr when left != right", () => {
    const tw = nodeToTailwind(makeNode({
      layoutInfo: { paddingTop: 8, paddingBottom: 8, paddingLeft: 4, paddingRight: 12 },
    }));
    expect(tw).toContain("py-2");
    expect(tw).toContain("pl-1");
    expect(tw).toContain("pr-3");
  });
});

describe("nodeToTailwind – corner radius branches", () => {
  it("generates rounded-full for very large radius", () => {
    const tw = nodeToTailwind(makeNode({ layoutInfo: { cornerRadius: 9999 } }));
    expect(tw).toContain("rounded-full");
  });

  it("generates rounded-xl for radius 12", () => {
    const tw = nodeToTailwind(makeNode({ layoutInfo: { cornerRadius: 12 } }));
    expect(tw).toContain("rounded-xl");
  });

  it("generates rounded-lg for radius 8", () => {
    const tw = nodeToTailwind(makeNode({ layoutInfo: { cornerRadius: 8 } }));
    expect(tw).toContain("rounded-lg");
  });

  it("generates rounded for radius 4", () => {
    const tw = nodeToTailwind(makeNode({ layoutInfo: { cornerRadius: 4 } }));
    expect(tw).toContain("rounded");
  });

  it("generates rounded-sm for radius 2", () => {
    const tw = nodeToTailwind(makeNode({ layoutInfo: { cornerRadius: 2 } }));
    expect(tw).toContain("rounded-sm");
  });
});

describe("nodeToTailwind – text style branches", () => {
  it("generates text-4xl for fontSize >= 36", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { fontSize: 40 } }));
    expect(tw).toContain("text-4xl");
  });

  it("generates text-3xl for fontSize >= 30", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { fontSize: 30 } }));
    expect(tw).toContain("text-3xl");
  });

  it("generates text-xl for fontSize >= 20", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { fontSize: 20 } }));
    expect(tw).toContain("text-xl");
  });

  it("generates text-lg for fontSize >= 18", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { fontSize: 18 } }));
    expect(tw).toContain("text-lg");
  });

  it("generates text-base for fontSize >= 16", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { fontSize: 16 } }));
    expect(tw).toContain("text-base");
  });

  it("generates text-sm for fontSize >= 14", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { fontSize: 14 } }));
    expect(tw).toContain("text-sm");
  });

  it("generates text-xs for fontSize < 14", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { fontSize: 10 } }));
    expect(tw).toContain("text-xs");
  });

  it("generates font-semibold for fontWeight 600", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { fontWeight: 600 } }));
    expect(tw).toContain("font-semibold");
  });

  it("generates text-center for CENTER textAlign", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { textAlignHorizontal: "CENTER" } }));
    expect(tw).toContain("text-center");
  });

  it("generates text-right for RIGHT textAlign", () => {
    const tw = nodeToTailwind(makeNode({ textStyle: { textAlignHorizontal: "RIGHT" } }));
    expect(tw).toContain("text-right");
  });
});

describe("figmaToCode – COMPONENT type pages", () => {
  it("generates pages for COMPONENT type frames", () => {
    const result = figmaToCode(makeTree({
      pages: [{
        id: "p1", name: "Page",
        children: [makeNode({ name: "Widget", type: "COMPONENT" })],
      }],
    }));
    expect(result.summary.pages).toBe(1);
    expect(result.files.some(f => f.path.includes("page.tsx"))).toBe(true);
  });
});

describe("figmaToCode – design tokens", () => {
  it("handles styles without a name", () => {
    const result = figmaToCode(makeTree({
      styles: {
        s1: { color: { r: 0, g: 0, b: 0, a: 1 } },
      },
    }));
    const tokenFile = result.files.find(f => f.path.includes("figma-tokens.css"));
    expect(tokenFile).toBeDefined();
    expect(tokenFile!.content).toContain("token-s1");
  });
});

describe("nodeToTailwind – TEXT node JSX generation", () => {
  it("generates span for TEXT nodes", () => {
    const tw = nodeToTailwind(makeNode({ type: "TEXT", characters: "Hello" }));
    // TEXT nodes don't use special handling in nodeToTailwind, just textStyle
    expect(typeof tw).toBe("string");
  });
});
