/**
 * Maps Figma style properties to Tailwind CSS classes.
 */

import type { ParsedNode } from "./node-parser";

export function mapTailwindClasses(node: ParsedNode): string {
  const classes: string[] = [];

  // Dimensions
  if (node.width) classes.push(`w-[${Math.round(node.width)}px]`);
  if (node.height) classes.push(`h-[${Math.round(node.height)}px]`);

  // Background color
  const solidFill = node.fills.find((f) => f.type === "SOLID" && f.color);
  if (solidFill?.color) {
    classes.push(`bg-[${solidFill.color}]`);
  }

  // Border radius
  if (node.cornerRadius) {
    if (node.cornerRadius >= 999) {
      classes.push("rounded-full");
    } else if (node.cornerRadius >= 16) {
      classes.push("rounded-xl");
    } else if (node.cornerRadius >= 8) {
      classes.push("rounded-lg");
    } else if (node.cornerRadius >= 4) {
      classes.push("rounded-md");
    } else {
      classes.push("rounded-sm");
    }
  }

  // Opacity (use arbitrary value syntax for Tailwind)
  if (node.opacity < 1) {
    const pct = Math.round(node.opacity * 100);
    classes.push(`opacity-[${pct}%]`);
  }

  // Layout (auto-layout → flexbox)
  if (node.layout) {
    classes.push("flex");
    if (node.layout.mode === "column") classes.push("flex-col");
    if (node.layout.gap > 0) classes.push(`gap-[${node.layout.gap}px]`);
    if (node.layout.alignItems === "center") classes.push("items-center");
    if (node.layout.justifyContent === "center") classes.push("justify-center");

    const [pt, pr, pb, pl] = node.layout.padding;
    if (pt === pr && pr === pb && pb === pl && pt > 0) {
      classes.push(`p-[${pt}px]`);
    } else {
      if (pt > 0) classes.push(`pt-[${pt}px]`);
      if (pr > 0) classes.push(`pr-[${pr}px]`);
      if (pb > 0) classes.push(`pb-[${pb}px]`);
      if (pl > 0) classes.push(`pl-[${pl}px]`);
    }
  }

  // Text styles
  if (node.type === "text" && node.height) {
    if (node.height >= 32) classes.push("text-2xl font-bold");
    else if (node.height >= 24) classes.push("text-xl font-semibold");
    else if (node.height >= 20) classes.push("text-lg");
    else classes.push("text-sm");
  }

  return classes.join(" ");
}
