// lib/figma/figmaToCode.ts
// Convert a DesignTree into generated React/TypeScript/Tailwind files.

import type { DesignNode, DesignTree, FigmaColor, FigmaFill } from "./parser";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  files: GeneratedFile[];
  summary: {
    components: number;
    pages: number;
    tokens: string[];
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function rgbaToHex(color: FigmaColor): string {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  return color.a < 1 ? `${hex}${toHex(color.a)}` : hex;
}

export function sanitizeComponentName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[0-9]+/, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    || "Component";
}

export function nodeToTailwind(node: DesignNode): string {
  const classes: string[] = [];
  const { layoutInfo, fills, opacity } = node;

  // Layout
  if (layoutInfo.layoutMode === "HORIZONTAL") {
    classes.push("flex", "flex-row");
  } else if (layoutInfo.layoutMode === "VERTICAL") {
    classes.push("flex", "flex-col");
  }

  // Alignment
  if (layoutInfo.primaryAxisAlignItems === "CENTER") classes.push("justify-center");
  if (layoutInfo.primaryAxisAlignItems === "SPACE_BETWEEN") classes.push("justify-between");
  if (layoutInfo.counterAxisAlignItems === "CENTER") classes.push("items-center");

  // Padding
  if (layoutInfo.paddingTop || layoutInfo.paddingBottom || layoutInfo.paddingLeft || layoutInfo.paddingRight) {
    const pt = layoutInfo.paddingTop ?? 0;
    const pb = layoutInfo.paddingBottom ?? 0;
    const pl = layoutInfo.paddingLeft ?? 0;
    const pr = layoutInfo.paddingRight ?? 0;
    if (pt === pb && pl === pr && pt === pl) {
      classes.push(`p-${Math.round(pt / 4)}`);
    } else {
      if (pt === pb) classes.push(`py-${Math.round(pt / 4)}`);
      else {
        classes.push(`pt-${Math.round(pt / 4)}`);
        classes.push(`pb-${Math.round(pb / 4)}`);
      }
      if (pl === pr) classes.push(`px-${Math.round(pl / 4)}`);
      else {
        classes.push(`pl-${Math.round(pl / 4)}`);
        classes.push(`pr-${Math.round(pr / 4)}`);
      }
    }
  }

  // Gap
  if (layoutInfo.itemSpacing) {
    classes.push(`gap-${Math.round(layoutInfo.itemSpacing / 4)}`);
  }

  // Corner radius
  if (layoutInfo.cornerRadius) {
    const r = layoutInfo.cornerRadius;
    if (r >= 9999) classes.push("rounded-full");
    else if (r >= 12) classes.push("rounded-xl");
    else if (r >= 8) classes.push("rounded-lg");
    else if (r >= 4) classes.push("rounded");
    else classes.push("rounded-sm");
  }

  // Width / height
  if (layoutInfo.width) {
    const w = Math.round(layoutInfo.width);
    classes.push(`w-[${w}px]`);
  }
  if (layoutInfo.height) {
    const h = Math.round(layoutInfo.height);
    classes.push(`h-[${h}px]`);
  }

  // Background from fills
  const solidFill = fills.find((f: FigmaFill) => f.type === "SOLID" && f.color);
  if (solidFill?.color) {
    const hex = rgbaToHex(solidFill.color);
    classes.push(`bg-[${hex}]`);
  }

  // Opacity
  if (opacity < 1) {
    classes.push(`opacity-${Math.round(opacity * 100)}`);
  }

  // Text styles
  if (node.textStyle) {
    const ts = node.textStyle;
    if (ts.fontSize) {
      const sz = ts.fontSize;
      if (sz >= 36) classes.push("text-4xl");
      else if (sz >= 30) classes.push("text-3xl");
      else if (sz >= 24) classes.push("text-2xl");
      else if (sz >= 20) classes.push("text-xl");
      else if (sz >= 18) classes.push("text-lg");
      else if (sz >= 16) classes.push("text-base");
      else if (sz >= 14) classes.push("text-sm");
      else classes.push("text-xs");
    }
    if (ts.fontWeight && ts.fontWeight >= 700) classes.push("font-bold");
    else if (ts.fontWeight && ts.fontWeight >= 600) classes.push("font-semibold");
    if (ts.textAlignHorizontal === "CENTER") classes.push("text-center");
    if (ts.textAlignHorizontal === "RIGHT") classes.push("text-right");
  }

  return classes.filter(Boolean).join(" ");
}

// ── Code generation ────────────────────────────────────────────────────────

function generateNodeJsx(node: DesignNode, depth = 0): string {
  const indent = "  ".repeat(depth + 1);
  const tw = nodeToTailwind(node);
  const className = tw ? ` className="${tw}"` : "";

  if (node.type === "TEXT") {
    return `${indent}<span${className}>${node.characters ?? node.name}</span>`;
  }

  if (node.children.length === 0) {
    return `${indent}<div${className} />`;
  }

  const childrenJsx = node.children
    .map((c) => generateNodeJsx(c, depth + 1))
    .join("\n");

  return `${indent}<div${className}>\n${childrenJsx}\n${indent}</div>`;
}

function generateComponentFile(name: string, node: DesignNode): string {
  const safeName = sanitizeComponentName(name);
  const tw = nodeToTailwind(node);
  const className = tw ? ` className="${tw}"` : "";

  const childrenJsx = node.children.length > 0
    ? node.children.map((c) => generateNodeJsx(c, 1)).join("\n")
    : "";

  return `import React from "react";

export function ${safeName}() {
  return (
    <div${className}>
${childrenJsx}
    </div>
  );
}

export default ${safeName};
`;
}

function generatePageFile(name: string, node: DesignNode): string {
  const safeName = sanitizeComponentName(name);
  const tw = nodeToTailwind(node);
  const className = tw ? ` className="${tw}"` : "";

  const childrenJsx = node.children.length > 0
    ? node.children.map((c) => generateNodeJsx(c, 2)).join("\n")
    : "";

  return `import React from "react";

export default function ${safeName}Page() {
  return (
    <main${className}>
${childrenJsx}
    </main>
  );
}
`;
}

function generateDesignTokens(tree: DesignTree): string {
  const tokens: string[] = [":root {"];

  for (const [id, style] of Object.entries(tree.styles)) {
    const s = style as Record<string, unknown>;
    const name = typeof s.name === "string"
      ? s.name.toLowerCase().replace(/\s+/g, "-")
      : `token-${id}`;
    if (typeof s.color === "object" && s.color !== null) {
      const c = s.color as FigmaColor;
      tokens.push(`  --color-${name}: ${rgbaToHex(c)};`);
    }
  }

  tokens.push("}");
  return tokens.join("\n");
}

// ── Main export ────────────────────────────────────────────────────────────

export function figmaToCode(tree: DesignTree): GenerationResult {
  const files: GeneratedFile[] = [];
  const componentNames: string[] = [];
  const pageNames: string[] = [];

  // Generate component files
  for (const [, node] of Object.entries(tree.components)) {
    const safeName = sanitizeComponentName(node.name);
    componentNames.push(safeName);
    files.push({
      path: `components/figma/${safeName}.tsx`,
      content: generateComponentFile(node.name, node),
    });
  }

  // Generate page files from top-level frames in each page
  for (const page of tree.pages) {
    for (const frame of page.children) {
      if (frame.type === "FRAME" || frame.type === "COMPONENT") {
        const safeName = sanitizeComponentName(frame.name);
        pageNames.push(safeName);
        files.push({
          path: `app/(generated)/${safeName.toLowerCase()}/page.tsx`,
          content: generatePageFile(frame.name, frame),
        });
      }
    }
  }

  // Design tokens
  if (Object.keys(tree.styles).length > 0) {
    files.push({
      path: "styles/figma-tokens.css",
      content: generateDesignTokens(tree),
    });
  }

  return {
    files,
    summary: {
      components: componentNames.length,
      pages: pageNames.length,
      tokens: Object.keys(tree.styles),
    },
  };
}
