import { describe, it, expect } from "vitest";
import { analyzeLayout, layoutToTailwind } from "@/lib/figma/layout-analyzer";
import type { ParsedNode } from "@/lib/figma/node-parser";

function node(overrides: Partial<ParsedNode> = {}): ParsedNode {
  return {
    id: "1", name: "N", type: "frame",
    x: 0, y: 0, width: 400, height: 300,
    fills: [], opacity: 1, children: [],
    ...overrides,
  };
}

describe("analyzeLayout", () => {
  it("returns flex column from auto-layout column", () => {
    const layout = analyzeLayout(node({
      layout: { mode: "column", gap: 8, padding: [0, 0, 0, 0], alignItems: "stretch", justifyContent: "flex-start" },
    }));
    expect(layout.display).toBe("flex");
    expect(layout.direction).toBe("column");
    expect(layout.gap).toBe(8);
  });

  it("returns flex row from auto-layout row", () => {
    const layout = analyzeLayout(node({
      layout: { mode: "row", gap: 16, padding: [0, 0, 0, 0], alignItems: "center", justifyContent: "center" },
    }));
    expect(layout.display).toBe("flex");
    expect(layout.direction).toBe("row");
    expect(layout.alignItems).toBe("center");
    expect(layout.justifyContent).toBe("center");
  });

  it("detects horizontal row from children y-coordinates", () => {
    const layout = analyzeLayout(node({
      children: [
        node({ x: 0, y: 10 }),
        node({ x: 100, y: 12 }),
        node({ x: 200, y: 11 }),
      ],
    }));
    expect(layout.display).toBe("flex");
    expect(layout.direction).toBe("row");
  });

  it("detects grid-like pattern from children", () => {
    const layout = analyzeLayout(node({
      children: [
        node({ x: 0, y: 0 }),
        node({ x: 200, y: 0 }),
        node({ x: 0, y: 200 }),
        node({ x: 200, y: 200 }),
      ],
    }));
    expect(layout.display).toBe("grid");
    expect(layout.columns).toBe(2);
  });

  it("returns column flex for vertical children", () => {
    const layout = analyzeLayout(node({
      children: [
        node({ x: 0, y: 0 }),
        node({ x: 0, y: 100 }),
      ],
    }));
    expect(layout.display).toBe("flex");
    expect(layout.direction).toBe("column");
  });

  it("returns block for node without children", () => {
    const layout = analyzeLayout(node({ children: [] }));
    expect(layout.display).toBe("block");
  });

  it("returns column flex for single child", () => {
    const layout = analyzeLayout(node({
      children: [node()],
    }));
    expect(layout.display).toBe("flex");
    expect(layout.direction).toBe("column");
  });
});

describe("layoutToTailwind", () => {
  it("generates flex with direction row (no flex-col)", () => {
    const tw = layoutToTailwind({ display: "flex", direction: "row", gap: 16 });
    expect(tw).toContain("flex");
    expect(tw).not.toContain("flex-col");
    expect(tw).toContain("gap-[16px]");
  });

  it("generates grid classes", () => {
    const tw = layoutToTailwind({ display: "grid", columns: 3, gap: 8 });
    expect(tw).toContain("grid");
    expect(tw).toContain("grid-cols-3");
    expect(tw).toContain("gap-[8px]");
  });

  it("generates justify-center for center justifyContent", () => {
    const tw = layoutToTailwind({ display: "flex", justifyContent: "center" });
    expect(tw).toContain("justify-center");
  });

  it("returns empty string for block display", () => {
    const tw = layoutToTailwind({ display: "block" });
    expect(tw).toBe("");
  });
});
