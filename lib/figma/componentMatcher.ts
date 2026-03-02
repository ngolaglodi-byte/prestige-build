// lib/figma/componentMatcher.ts
// Matches Figma design nodes to well-known UI library components
// (e.g. shadcn/ui, Tailwind UI patterns). This improves code quality
// by replacing raw <div> wrappers with semantic components.

import type { DesignNode } from "./parser";

export interface ComponentMatch {
  component: string;
  confidence: number;  // 0-1
  importPath: string;
  props: Record<string, string>;
}

interface MatchRule {
  /** Human-readable name of the target component */
  component: string;
  importPath: string;
  /** Tests to run against the node to determine match likelihood */
  test: (node: DesignNode) => number;
  /** Extra props to inject when matched */
  defaultProps?: Record<string, string>;
}

const RULES: MatchRule[] = [
  {
    component: "Button",
    importPath: "@/components/ui/button",
    test(node) {
      const name = node.name.toLowerCase();
      if (name.includes("button") || name.includes("btn") || name.includes("cta")) return 0.9;
      // Small, rounded, text-only → likely a button
      const { width, height, cornerRadius } = node.layoutInfo;
      if (width && height && width < 300 && height < 60 && cornerRadius && cornerRadius >= 4) {
        return 0.5;
      }
      return 0;
    },
    defaultProps: { variant: '"default"' },
  },
  {
    component: "Card",
    importPath: "@/components/ui/card",
    test(node) {
      const name = node.name.toLowerCase();
      if (name.includes("card")) return 0.9;
      // Large rounded container with children
      const { cornerRadius } = node.layoutInfo;
      if (cornerRadius && cornerRadius >= 8 && node.children.length > 0) return 0.4;
      return 0;
    },
  },
  {
    component: "Input",
    importPath: "@/components/ui/input",
    test(node) {
      const name = node.name.toLowerCase();
      if (name.includes("input") || name.includes("textfield") || name.includes("search")) return 0.9;
      // Single-line height, wide, border radius
      const { width, height, cornerRadius } = node.layoutInfo;
      if (width && height && height < 50 && width > 150 && cornerRadius && cornerRadius >= 4 && node.children.length <= 1) {
        return 0.5;
      }
      return 0;
    },
  },
  {
    component: "Avatar",
    importPath: "@/components/ui/avatar",
    test(node) {
      const name = node.name.toLowerCase();
      if (name.includes("avatar") || name.includes("profile-pic")) return 0.9;
      // Circular, small
      const { width, height, cornerRadius } = node.layoutInfo;
      if (width && height && Math.abs(width - height) < 4 && cornerRadius && cornerRadius >= 9999 && width < 80) {
        return 0.7;
      }
      return 0;
    },
  },
  {
    component: "Badge",
    importPath: "@/components/ui/badge",
    test(node) {
      const name = node.name.toLowerCase();
      if (name.includes("badge") || name.includes("tag") || name.includes("chip")) return 0.9;
      const { width, height, cornerRadius } = node.layoutInfo;
      if (width && height && height < 30 && width < 120 && cornerRadius && cornerRadius >= 8) {
        return 0.5;
      }
      return 0;
    },
  },
];

/**
 * Given a DesignNode, find the best matching UI component.
 * Returns null if no rule matches with confidence >= threshold.
 */
export function matchComponent(
  node: DesignNode,
  threshold = 0.4
): ComponentMatch | null {
  let best: ComponentMatch | null = null;

  for (const rule of RULES) {
    const score = rule.test(node);
    if (score >= threshold && (!best || score > best.confidence)) {
      best = {
        component: rule.component,
        confidence: score,
        importPath: rule.importPath,
        props: rule.defaultProps ?? {},
      };
    }
  }

  return best;
}

/**
 * Batch-match all immediate children of a node.
 */
export function matchChildren(
  parent: DesignNode,
  threshold = 0.4
): Map<string, ComponentMatch> {
  const matches = new Map<string, ComponentMatch>();
  for (const child of parent.children) {
    const m = matchComponent(child, threshold);
    if (m) matches.set(child.id, m);
  }
  return matches;
}
