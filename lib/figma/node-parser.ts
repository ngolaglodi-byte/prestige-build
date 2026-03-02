/**
 * Parses Figma node tree into an intermediate representation for conversion.
 */

import type { FigmaNode } from "./figma-client";

export interface ParsedNode {
  id: string;
  name: string;
  type: "frame" | "text" | "rectangle" | "image" | "component" | "group" | "vector" | "other";
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fills: { type: string; color?: string; imageRef?: string }[];
  cornerRadius?: number;
  opacity: number;
  layout?: { mode: "row" | "column" | "none"; gap: number; padding: [number, number, number, number]; alignItems: string; justifyContent: string };
  children: ParsedNode[];
}

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  const hex = [r, g, b]
    .map((c) => Math.round(c * 255).toString(16).padStart(2, "0"))
    .join("");
  return a < 1 ? `#${hex}${Math.round(a * 255).toString(16).padStart(2, "0")}` : `#${hex}`;
}

function mapType(figmaType: string): ParsedNode["type"] {
  switch (figmaType) {
    case "FRAME":
    case "INSTANCE":
      return "frame";
    case "TEXT":
      return "text";
    case "RECTANGLE":
    case "ELLIPSE":
    case "LINE":
      return "rectangle";
    case "COMPONENT":
      return "component";
    case "GROUP":
      return "group";
    case "VECTOR":
    case "BOOLEAN_OPERATION":
      return "vector";
    default:
      return "other";
  }
}

function mapLayout(node: FigmaNode): ParsedNode["layout"] {
  if (!node.layoutMode || node.layoutMode === "NONE") return undefined;
  return {
    mode: node.layoutMode === "HORIZONTAL" ? "row" : "column",
    gap: node.itemSpacing ?? 0,
    padding: [
      node.paddingTop ?? 0,
      node.paddingRight ?? 0,
      node.paddingBottom ?? 0,
      node.paddingLeft ?? 0,
    ],
    alignItems: node.counterAxisAlignItems === "CENTER" ? "center" : "stretch",
    justifyContent: node.primaryAxisAlignItems === "CENTER" ? "center" : "flex-start",
  };
}

export function parseNode(node: FigmaNode): ParsedNode {
  const bbox = node.absoluteBoundingBox ?? { x: 0, y: 0, width: 0, height: 0 };
  const fills = (node.fills ?? [])
    .filter((f) => f.visible !== false)
    .map((f) => ({
      type: f.type,
      color: f.color ? rgbaToHex(f.color.r, f.color.g, f.color.b, f.color.a) : undefined,
      imageRef: f.imageRef,
    }));

  return {
    id: node.id,
    name: node.name,
    type: mapType(node.type),
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height,
    text: node.characters,
    fills,
    cornerRadius: node.cornerRadius,
    opacity: node.opacity ?? 1,
    layout: mapLayout(node),
    children: (node.children ?? []).map(parseNode),
  };
}

export function parseFileNodes(document: FigmaNode): ParsedNode[] {
  // The document contains pages as children
  return (document.children ?? []).map(parseNode);
}
