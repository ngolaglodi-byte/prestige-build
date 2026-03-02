// lib/figma/responsiveMapper.ts
// Converts absolute Figma dimensions into responsive Tailwind breakpoint
// classes. Analyses the frame width to guess which breakpoint it was
// designed for, then emits appropriate responsive prefixes.

import type { DesignNode } from "./parser";

export interface ResponsiveClass {
  base: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
}

/**
 * Given a top-level frame, determine which Tailwind breakpoint it targets
 * based on its width.
 */
export function detectBreakpoint(width: number): "base" | "sm" | "md" | "lg" | "xl" {
  if (width >= 1280) return "xl";
  if (width >= 1024) return "lg";
  if (width >= 768) return "md";
  if (width >= 640) return "sm";
  return "base";
}

/**
 * Produce responsive width/height utilities for a node.
 * For example, a 375px-wide frame will produce `w-full` at base,
 * while a 1440px-wide frame will get `xl:max-w-7xl`.
 */
export function responsiveClasses(node: DesignNode): string[] {
  const classes: string[] = [];
  const w = node.layoutInfo.width ?? 0;
  const bp = detectBreakpoint(w);

  if (w > 0) {
    if (bp === "base") {
      classes.push("w-full");
    } else if (bp === "sm") {
      classes.push("w-full", "sm:max-w-xl");
    } else if (bp === "md") {
      classes.push("w-full", "md:max-w-3xl");
    } else if (bp === "lg") {
      classes.push("w-full", "lg:max-w-5xl");
    } else {
      classes.push("w-full", "xl:max-w-7xl");
    }
    classes.push("mx-auto");
  }

  // Container padding responsive hints
  const pad = node.layoutInfo.paddingLeft ?? node.layoutInfo.paddingRight ?? 0;
  if (pad > 0) {
    classes.push("px-4", "md:px-6", "lg:px-8");
  }

  return classes;
}

/**
 * Map multiple Figma variant frames (mobile, tablet, desktop) into a
 * combined set of responsive Tailwind classes.
 */
export function mergeResponsiveVariants(
  variants: { breakpoint: "base" | "sm" | "md" | "lg" | "xl"; classes: string[] }[]
): string {
  const merged: string[] = [];
  for (const v of variants) {
    const prefix = v.breakpoint === "base" ? "" : `${v.breakpoint}:`;
    for (const cls of v.classes) {
      merged.push(`${prefix}${cls}`);
    }
  }
  return merged.join(" ");
}
