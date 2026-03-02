/**
 * Extracts image assets from Figma nodes for download/upload.
 */

import type { ParsedNode } from "./node-parser";

export interface AssetReference {
  nodeId: string;
  nodeName: string;
  imageRef: string;
}

/**
 * Recursively finds all image fill references in a parsed tree.
 */
export function extractAssets(nodes: ParsedNode[]): AssetReference[] {
  const assets: AssetReference[] = [];

  function walk(node: ParsedNode) {
    for (const fill of node.fills) {
      if (fill.type === "IMAGE" && fill.imageRef) {
        assets.push({
          nodeId: node.id,
          nodeName: node.name,
          imageRef: fill.imageRef,
        });
      }
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  for (const n of nodes) walk(n);
  return assets;
}
