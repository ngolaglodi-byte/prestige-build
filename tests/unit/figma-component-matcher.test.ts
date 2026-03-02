import { describe, it, expect } from "vitest";
import { matchComponent, matchChildren } from "@/lib/figma/componentMatcher";
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

describe("componentMatcher", () => {
  describe("matchComponent", () => {
    it("matches a node named Button to Button component", () => {
      const node = makeNode({ name: "Primary Button" });
      const match = matchComponent(node);
      expect(match).not.toBeNull();
      expect(match!.component).toBe("Button");
      expect(match!.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it("matches a node named Card to Card component", () => {
      const node = makeNode({
        name: "Product Card",
        layoutInfo: { cornerRadius: 12 },
        children: [makeNode({ name: "Title" })],
      });
      const match = matchComponent(node);
      expect(match).not.toBeNull();
      expect(match!.component).toBe("Card");
    });

    it("matches a node named Input to Input component", () => {
      const node = makeNode({ name: "Search Input" });
      const match = matchComponent(node);
      expect(match).not.toBeNull();
      expect(match!.component).toBe("Input");
    });

    it("matches a node named Avatar", () => {
      const node = makeNode({ name: "User Avatar" });
      const match = matchComponent(node);
      expect(match).not.toBeNull();
      expect(match!.component).toBe("Avatar");
    });

    it("matches a node named Badge", () => {
      const node = makeNode({ name: "Status Badge" });
      const match = matchComponent(node);
      expect(match).not.toBeNull();
      expect(match!.component).toBe("Badge");
    });

    it("returns null for an unrecognised node", () => {
      const node = makeNode({ name: "RandomDecoration", layoutInfo: {} });
      const match = matchComponent(node);
      expect(match).toBeNull();
    });
  });

  describe("matchChildren", () => {
    it("returns matches for child nodes", () => {
      const parent = makeNode({
        children: [
          makeNode({ id: "c1", name: "Submit Button" }),
          makeNode({ id: "c2", name: "RandomBox" }),
        ],
      });
      const matches = matchChildren(parent);
      expect(matches.has("c1")).toBe(true);
      expect(matches.get("c1")!.component).toBe("Button");
      // c2 should not match
      expect(matches.has("c2")).toBe(false);
    });

    it("returns empty map for no matches", () => {
      const parent = makeNode({
        children: [makeNode({ id: "c1", name: "Decoration" })],
      });
      const matches = matchChildren(parent);
      expect(matches.size).toBe(0);
    });
  });
});
