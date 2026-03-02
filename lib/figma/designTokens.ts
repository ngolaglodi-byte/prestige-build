// lib/figma/designTokens.ts
// Extracts design tokens (colours, typographies, spacings, shadows) from
// a parsed Figma DesignTree and generates CSS custom properties or a
// Tailwind config extension.

import type { DesignTree, FigmaColor, DesignNode, FigmaEffect } from "./parser";
import { rgbaToHex } from "./figmaToCode";

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, { fontFamily: string; fontSize: number; fontWeight: number }>;
  spacing: Record<string, number>;
  shadows: Record<string, string>;
}

/**
 * Walk the tree collecting token-worthy values.
 */
export function extractDesignTokens(tree: DesignTree): DesignTokens {
  const colors: Record<string, string> = {};
  const typography: Record<string, { fontFamily: string; fontSize: number; fontWeight: number }> = {};
  const spacing: Record<string, number> = {};
  const shadows: Record<string, string> = {};

  // 1. Styles from the top-level styles map
  for (const [id, style] of Object.entries(tree.styles)) {
    const s = style as Record<string, unknown>;
    const name = typeof s.name === "string"
      ? slugify(s.name)
      : `token-${id}`;

    if (typeof s.color === "object" && s.color !== null) {
      colors[name] = rgbaToHex(s.color as FigmaColor);
    }
  }

  // 2. Walk every node to collect colours, fonts, and spacing
  function walk(node: DesignNode) {
    // Colours from fills
    for (const fill of node.fills) {
      if (fill.type === "SOLID" && fill.color) {
        const hex = rgbaToHex(fill.color);
        const key = slugify(node.name) || `fill-${node.id}`;
        if (!Object.values(colors).includes(hex)) {
          colors[key] = hex;
        }
      }
    }

    // Typography from text styles
    if (node.textStyle) {
      const ts = node.textStyle;
      const key = slugify(node.name) || `text-${node.id}`;
      typography[key] = {
        fontFamily: ts.fontFamily ?? "sans-serif",
        fontSize: ts.fontSize ?? 16,
        fontWeight: ts.fontWeight ?? 400,
      };
    }

    // Spacing from padding / gap
    const li = node.layoutInfo;
    if (li.itemSpacing && li.itemSpacing > 0) {
      spacing[`gap-${node.id}`] = li.itemSpacing;
    }
    if (li.paddingTop && li.paddingTop > 0) {
      spacing[`padding-${node.id}`] = li.paddingTop;
    }

    // Shadows from effects
    if (node.effects) {
      for (const effect of node.effects) {
        if (
          (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") &&
          effect.visible !== false &&
          effect.color
        ) {
          const css = effectToCssShadow(effect);
          const key = slugify(node.name) || `shadow-${node.id}`;
          if (!Object.values(shadows).includes(css)) {
            shadows[key] = css;
          }
        }
      }
    }

    for (const child of node.children) walk(child);
  }

  for (const page of tree.pages) {
    for (const child of page.children) walk(child);
  }

  return { colors, typography, spacing, shadows };
}

/**
 * Generate a CSS :root {} block from tokens.
 */
export function tokensToCss(tokens: DesignTokens): string {
  const lines: string[] = [":root {"];

  for (const [name, value] of Object.entries(tokens.colors)) {
    lines.push(`  --color-${name}: ${value};`);
  }

  for (const [name, t] of Object.entries(tokens.typography)) {
    lines.push(`  --font-${name}: ${t.fontFamily};`);
    lines.push(`  --text-${name}-size: ${t.fontSize}px;`);
    lines.push(`  --text-${name}-weight: ${t.fontWeight};`);
  }

  for (const [name, value] of Object.entries(tokens.spacing)) {
    lines.push(`  --spacing-${name}: ${value}px;`);
  }

  for (const [name, value] of Object.entries(tokens.shadows)) {
    lines.push(`  --shadow-${name}: ${value};`);
  }

  lines.push("}");
  return lines.join("\n");
}

/**
 * Generate a partial Tailwind theme extension from tokens.
 */
export function tokensToTailwindExtend(tokens: DesignTokens): Record<string, unknown> {
  const colors: Record<string, string> = {};
  for (const [name, value] of Object.entries(tokens.colors)) {
    colors[name] = value;
  }

  const fontSize: Record<string, string> = {};
  for (const [name, t] of Object.entries(tokens.typography)) {
    fontSize[name] = `${t.fontSize}px`;
  }

  const spacing: Record<string, string> = {};
  for (const [name, value] of Object.entries(tokens.spacing)) {
    spacing[name] = `${value}px`;
  }

  const boxShadow: Record<string, string> = {};
  for (const [name, value] of Object.entries(tokens.shadows)) {
    boxShadow[name] = value;
  }

  return { colors, fontSize, spacing, boxShadow };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function effectToCssShadow(effect: FigmaEffect): string {
  const x = effect.offset?.x ?? 0;
  const y = effect.offset?.y ?? 0;
  const blur = effect.radius ?? 0;
  const spread = effect.spread ?? 0;
  const color = effect.color ? rgbaToHex(effect.color) : "#000000";
  const inset = effect.type === "INNER_SHADOW" ? "inset " : "";
  return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
