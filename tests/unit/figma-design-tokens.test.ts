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

    it("extracts shadows from drop shadow effects", () => {
      const tokens = extractDesignTokens(
        makeTree({
          pages: [
            {
              id: "p1",
              name: "Home",
              children: [
                {
                  id: "n1",
                  name: "Card",
                  type: "FRAME",
                  fills: [],
                  opacity: 1,
                  layoutInfo: {},
                  children: [],
                  isComponent: false,
                  effects: [
                    {
                      type: "DROP_SHADOW",
                      visible: true,
                      color: { r: 0, g: 0, b: 0, a: 0.25 },
                      offset: { x: 0, y: 4 },
                      radius: 8,
                      spread: 0,
                    },
                  ],
                },
              ],
            },
          ],
        })
      );
      expect(tokens.shadows["card"]).toBeDefined();
      expect(tokens.shadows["card"]).toContain("4px");
      expect(tokens.shadows["card"]).toContain("8px");
    });

    it("extracts inner shadow effects", () => {
      const tokens = extractDesignTokens(
        makeTree({
          pages: [
            {
              id: "p1",
              name: "Home",
              children: [
                {
                  id: "n1",
                  name: "Well",
                  type: "FRAME",
                  fills: [],
                  opacity: 1,
                  layoutInfo: {},
                  children: [],
                  isComponent: false,
                  effects: [
                    {
                      type: "INNER_SHADOW",
                      visible: true,
                      color: { r: 0, g: 0, b: 0, a: 0.1 },
                      offset: { x: 0, y: 2 },
                      radius: 4,
                      spread: 0,
                    },
                  ],
                },
              ],
            },
          ],
        })
      );
      expect(tokens.shadows["well"]).toBeDefined();
      expect(tokens.shadows["well"]).toContain("inset");
    });

    it("skips invisible effects", () => {
      const tokens = extractDesignTokens(
        makeTree({
          pages: [
            {
              id: "p1",
              name: "Home",
              children: [
                {
                  id: "n1",
                  name: "Hidden",
                  type: "FRAME",
                  fills: [],
                  opacity: 1,
                  layoutInfo: {},
                  children: [],
                  isComponent: false,
                  effects: [
                    {
                      type: "DROP_SHADOW",
                      visible: false,
                      color: { r: 0, g: 0, b: 0, a: 0.5 },
                      offset: { x: 0, y: 4 },
                      radius: 8,
                    },
                  ],
                },
              ],
            },
          ],
        })
      );
      expect(Object.keys(tokens.shadows)).toHaveLength(0);
    });

    it("extracts radii from cornerRadius", () => {
      const tokens = extractDesignTokens(
        makeTree({
          pages: [
            {
              id: "p1",
              name: "Home",
              children: [
                {
                  id: "n1",
                  name: "Button",
                  type: "FRAME",
                  fills: [],
                  opacity: 1,
                  layoutInfo: { cornerRadius: 8 },
                  children: [],
                  isComponent: false,
                },
              ],
            },
          ],
        })
      );
      expect(tokens.radii["button"]).toBe("8px");
    });
  });

  describe("tokensToCss", () => {
    it("generates :root block", () => {
      const css = tokensToCss({
        colors: { primary: "#6366F1" },
        typography: {},
        spacing: {},
        shadows: {},
        radii: {},
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
        radii: {},
      });
      expect(css).toContain("--font-heading: Inter");
      expect(css).toContain("--text-heading-size: 20px");
    });

    it("includes shadow variables", () => {
      const css = tokensToCss({
        colors: {},
        typography: {},
        spacing: {},
        shadows: { card: "0px 4px 8px 0px #00000040" },
        radii: {},
      });
      expect(css).toContain("--shadow-card: 0px 4px 8px 0px #00000040");
    });

    it("includes radii variables", () => {
      const css = tokensToCss({
        colors: {},
        typography: {},
        spacing: {},
        shadows: {},
        radii: { button: "8px" },
      });
      expect(css).toContain("--radius-button: 8px");
    });
  });

  describe("tokensToTailwindExtend", () => {
    it("returns an object with colors key", () => {
      const result = tokensToTailwindExtend({
        colors: { accent: "#EC4899" },
        typography: {},
        spacing: {},
        shadows: {},
        radii: {},
      });
      expect(result.colors).toEqual({ accent: "#EC4899" });
    });

    it("returns fontSize from typography", () => {
      const result = tokensToTailwindExtend({
        colors: {},
        typography: { body: { fontFamily: "Inter", fontSize: 16, fontWeight: 400 } },
        spacing: {},
        shadows: {},
        radii: {},
      });
      expect((result.fontSize as Record<string, string>).body).toBe("16px");
    });

    it("returns boxShadow from shadows", () => {
      const result = tokensToTailwindExtend({
        colors: {},
        typography: {},
        spacing: {},
        shadows: { card: "0px 4px 8px 0px #000000" },
        radii: {},
      });
      expect((result.boxShadow as Record<string, string>).card).toBe("0px 4px 8px 0px #000000");
    });

    it("returns borderRadius from radii", () => {
      const result = tokensToTailwindExtend({
        colors: {},
        typography: {},
        spacing: {},
        shadows: {},
        radii: { button: "8px" },
      });
      expect((result.borderRadius as Record<string, string>).button).toBe("8px");
    });
  });
});
