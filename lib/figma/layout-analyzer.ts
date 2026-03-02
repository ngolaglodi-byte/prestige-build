/**
 * Analyzes Figma auto-layout properties and converts to CSS Flexbox/Grid.
 */

import type { ParsedNode } from "./node-parser";

export interface LayoutSuggestion {
  display: "flex" | "grid" | "block";
  direction?: "row" | "column";
  gap?: number;
  columns?: number;
  alignItems?: string;
  justifyContent?: string;
}

/**
 * Analyze a node's children layout to determine best CSS layout strategy.
 */
export function analyzeLayout(node: ParsedNode): LayoutSuggestion {
  // If the node has explicit auto-layout
  if (node.layout && node.layout.mode !== "none") {
    return {
      display: "flex",
      direction: node.layout.mode === "row" ? "row" : "column",
      gap: node.layout.gap,
      alignItems: node.layout.alignItems,
      justifyContent: node.layout.justifyContent,
    };
  }

  // Heuristic: if children are roughly aligned horizontally
  if (node.children.length >= 2) {
    const ys = node.children.map((c) => c.y);
    const sameRow = ys.every((y) => Math.abs(y - ys[0]) < 10);
    if (sameRow) {
      return { display: "flex", direction: "row", gap: 16 };
    }

    // Check for grid-like pattern (2+ columns)
    const xs = [...new Set(node.children.map((c) => Math.round(c.x / 10) * 10))];
    if (xs.length >= 2 && xs.length <= 4 && node.children.length >= 4) {
      return { display: "grid", columns: xs.length, gap: 16 };
    }
  }

  // Default vertical stack
  if (node.children.length > 0) {
    return { display: "flex", direction: "column", gap: 8 };
  }

  return { display: "block" };
}

export function layoutToTailwind(layout: LayoutSuggestion): string {
  const classes: string[] = [];

  if (layout.display === "flex") {
    classes.push("flex");
    if (layout.direction === "column") classes.push("flex-col");
    if (layout.gap) classes.push(`gap-[${layout.gap}px]`);
    if (layout.alignItems === "center") classes.push("items-center");
    if (layout.justifyContent === "center") classes.push("justify-center");
  } else if (layout.display === "grid") {
    classes.push("grid");
    if (layout.columns) classes.push(`grid-cols-${layout.columns}`);
    if (layout.gap) classes.push(`gap-[${layout.gap}px]`);
  }

  return classes.join(" ");
}
