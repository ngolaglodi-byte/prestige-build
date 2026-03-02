import { describe, it, expect } from "vitest";
import {
  extractDesignTokens,
  tokensToCss,
  tokensToTailwindExtend,
} from "@/lib/figma/designTokens";
import type { DesignTree } from "@/lib/figma/parser";

function makeTree(overrides: Partial<DesignTree> = {}): DesignTree {
  return {
    fileKey: "fk1",
    fileName: "Test",
    pages: [],
    components: {},
    styles: {},
    ...overrides,
  };
}

describe("designTokens", () => {
  describe("extractDesignTokens", () => {
    it("returns empty tokens for empty tree", () => {
      const tokens = extractDesignTokens(makeTree());
      expect(Object.keys(tokens.colors)).toHaveLength(0);
      expect(Object.keys(tokens.typography)).toHaveLength(0);
    });

    it("extracts colours from styles map", () => {
      const tokens = extractDesignTokens(
        makeTree({
          styles: {
            s1: { name: "Primary", color: { r: 0.4, g: 0.4, b: 1, a: 1 } },
          },
        })
      );
      expect(tokens.colors["primary"]).toBeDefined();
    });

    it("extracts colours from node fills", () => {
      const tokens = extractDesignTokens(
        makeTree({
          pages: [
            {
              id: "p1",
              name: "Home",
              children: [
                {
                  id: "n1",
                  name: "Hero",
                  type: "FRAME",
                  fills: [{ type: "SOLID", color: { r: 1, g: 0, b: 0, a: 1 } }],
                  opacity: 1,
                  layoutInfo: {},
                  children: [],
                  isComponent: false,
                },
              ],
            },
          ],
        })
      );
      expect(Object.values(tokens.colors)).toContain("#ff0000");
    });

    it("extracts typography from text nodes", () => {
      const tokens = extractDesignTokens(
        makeTree({
          pages: [
            {
              id: "p1",
              name: "Home",
              children: [
                {
                  id: "n1",
                  name: "Title",
                  type: "TEXT",
                  fills: [],
                  opacity: 1,
                  layoutInfo: {},
                  textStyle: { fontFamily: "Inter", fontSize: 24, fontWeight: 700 },
                  children: [],
                  isComponent: false,
                },
              ],
            },
          ],
        })
      );
      expect(tokens.typography["title"]).toBeDefined();
      expect(tokens.typography["title"].fontSize).toBe(24);
    });
  });

  describe("tokensToCss", () => {
    it("generates :root block", () => {
      const css = tokensToCss({
        colors: { primary: "#6366F1" },
        typography: {},
        spacing: {},
        shadows: {},
      });
      expect(css).toContain(":root {");
      expect(css).toContain("--color-primary: #6366F1");
    });

    it("includes typography variables", () => {
      const css = tokensToCss({
        colors: {},
        typography: { heading: { fontFamily: "Inter", fontSize: 20, fontWeight: 700 } },
        spacing: {},
        shadows: {},
      });
      expect(css).toContain("--font-heading: Inter");
      expect(css).toContain("--text-heading-size: 20px");
    });
  });

  describe("tokensToTailwindExtend", () => {
    it("returns an object with colors key", () => {
      const result = tokensToTailwindExtend({
        colors: { accent: "#EC4899" },
        typography: {},
        spacing: {},
        shadows: {},
      });
      expect(result.colors).toEqual({ accent: "#EC4899" });
    });

    it("returns fontSize from typography", () => {
      const result = tokensToTailwindExtend({
        colors: {},
        typography: { body: { fontFamily: "Inter", fontSize: 16, fontWeight: 400 } },
        spacing: {},
        shadows: {},
      });
      expect((result.fontSize as Record<string, string>).body).toBe("16px");
    });
  });
});
