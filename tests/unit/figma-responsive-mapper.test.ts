import { describe, it, expect } from "vitest";
import {
  detectBreakpoint,
  responsiveClasses,
  mergeResponsiveVariants,
} from "@/lib/figma/responsiveMapper";
import type { DesignNode } from "@/lib/figma/parser";

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

describe("responsiveMapper", () => {
  describe("detectBreakpoint", () => {
    it("returns base for small widths", () => {
      expect(detectBreakpoint(375)).toBe("base");
    });

    it("returns sm for 640+", () => {
      expect(detectBreakpoint(640)).toBe("sm");
    });

    it("returns md for 768+", () => {
      expect(detectBreakpoint(768)).toBe("md");
    });

    it("returns lg for 1024+", () => {
      expect(detectBreakpoint(1024)).toBe("lg");
    });

    it("returns xl for 1280+", () => {
      expect(detectBreakpoint(1440)).toBe("xl");
    });
  });

  describe("responsiveClasses", () => {
    it("returns w-full for mobile-width frame", () => {
      const node = makeNode({ layoutInfo: { width: 375 } });
      const classes = responsiveClasses(node);
      expect(classes).toContain("w-full");
    });

    it("returns max-w-7xl for desktop-width frame", () => {
      const node = makeNode({ layoutInfo: { width: 1440 } });
      const classes = responsiveClasses(node);
      expect(classes).toContain("xl:max-w-7xl");
    });

    it("adds responsive padding when padding exists", () => {
      const node = makeNode({ layoutInfo: { width: 768, paddingLeft: 16 } });
      const classes = responsiveClasses(node);
      expect(classes).toContain("px-4");
      expect(classes).toContain("md:px-6");
    });
  });

  describe("mergeResponsiveVariants", () => {
    it("merges variants into a single string", () => {
      const result = mergeResponsiveVariants([
        { breakpoint: "base", classes: ["w-full"] },
        { breakpoint: "md", classes: ["max-w-3xl"] },
      ]);
      expect(result).toBe("w-full md:max-w-3xl");
    });

    it("handles empty variants", () => {
      expect(mergeResponsiveVariants([])).toBe("");
    });
  });
});
