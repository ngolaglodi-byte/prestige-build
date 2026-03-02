import { describe, it, expect } from "vitest";
import { mapTailwindClasses } from "@/lib/figma/tailwind-mapper";
import type { ParsedNode } from "@/lib/figma/node-parser";

function node(overrides: Partial<ParsedNode> = {}): ParsedNode {
  return {
    id: "1", name: "N", type: "rectangle",
    x: 0, y: 0, width: 100, height: 50,
    fills: [], opacity: 1, children: [],
    ...overrides,
  };
}

describe("tailwind-mapper – corner radius", () => {
  it("maps large radius to rounded-full", () => {
    expect(mapTailwindClasses(node({ cornerRadius: 999 }))).toContain("rounded-full");
  });

  it("maps radius 16 to rounded-xl", () => {
    expect(mapTailwindClasses(node({ cornerRadius: 16 }))).toContain("rounded-xl");
  });

  it("maps radius 8 to rounded-lg", () => {
    expect(mapTailwindClasses(node({ cornerRadius: 8 }))).toContain("rounded-lg");
  });

  it("maps radius 4 to rounded-md", () => {
    expect(mapTailwindClasses(node({ cornerRadius: 4 }))).toContain("rounded-md");
  });

  it("maps radius 2 to rounded-sm", () => {
    expect(mapTailwindClasses(node({ cornerRadius: 2 }))).toContain("rounded-sm");
  });
});

describe("tailwind-mapper – opacity", () => {
  it("adds opacity class when opacity < 1", () => {
    expect(mapTailwindClasses(node({ opacity: 0.75 }))).toContain("opacity-[75%]");
  });

  it("does not add opacity class when opacity is 1", () => {
    expect(mapTailwindClasses(node({ opacity: 1 }))).not.toContain("opacity");
  });
});

describe("tailwind-mapper – layout", () => {
  it("generates flex column with gap and items-center", () => {
    const classes = mapTailwindClasses(node({
      layout: {
        mode: "column", gap: 12,
        padding: [8, 8, 8, 8],
        alignItems: "center", justifyContent: "center",
      },
    }));
    expect(classes).toContain("flex");
    expect(classes).toContain("flex-col");
    expect(classes).toContain("gap-[12px]");
    expect(classes).toContain("items-center");
    expect(classes).toContain("justify-center");
    expect(classes).toContain("p-[8px]");
  });

  it("generates individual padding classes when not uniform", () => {
    const classes = mapTailwindClasses(node({
      layout: {
        mode: "row", gap: 0,
        padding: [4, 8, 12, 16],
        alignItems: "stretch", justifyContent: "flex-start",
      },
    }));
    expect(classes).toContain("pt-[4px]");
    expect(classes).toContain("pr-[8px]");
    expect(classes).toContain("pb-[12px]");
    expect(classes).toContain("pl-[16px]");
  });

  it("does not add gap when gap is 0", () => {
    const classes = mapTailwindClasses(node({
      layout: {
        mode: "row", gap: 0,
        padding: [0, 0, 0, 0],
        alignItems: "stretch", justifyContent: "flex-start",
      },
    }));
    expect(classes).not.toContain("gap");
  });
});

describe("tailwind-mapper – text styles", () => {
  it("adds text-2xl font-bold for large text", () => {
    const classes = mapTailwindClasses(node({ type: "text", height: 32 }));
    expect(classes).toContain("text-2xl");
    expect(classes).toContain("font-bold");
  });

  it("adds text-xl font-semibold for medium-large text", () => {
    const classes = mapTailwindClasses(node({ type: "text", height: 24 }));
    expect(classes).toContain("text-xl");
    expect(classes).toContain("font-semibold");
  });

  it("adds text-lg for medium text", () => {
    const classes = mapTailwindClasses(node({ type: "text", height: 20 }));
    expect(classes).toContain("text-lg");
  });

  it("adds text-sm for small text", () => {
    const classes = mapTailwindClasses(node({ type: "text", height: 16 }));
    expect(classes).toContain("text-sm");
  });
});
