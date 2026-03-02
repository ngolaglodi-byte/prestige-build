/**
 * Converts parsed Figma nodes to React/JSX components.
 */

import type { ParsedNode } from "./node-parser";
import { mapTailwindClasses } from "./tailwind-mapper";

function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[0-9]/, "C$&");
}

function nodeToJsx(node: ParsedNode, depth: number): string {
  const indent = "  ".repeat(depth);
  const classes = mapTailwindClasses(node);

  // Text node
  if (node.type === "text" && node.text) {
    const tag = node.height && node.height >= 28 ? "h2" : "p";
    return `${indent}<${tag} className="${classes}">${escapeJsx(node.text)}</${tag}>`;
  }

  // Image node
  if (node.fills.some((f) => f.type === "IMAGE")) {
    return `${indent}<img className="${classes}" src="/placeholder.svg" alt="${escapeJsx(node.name)}" />`;
  }

  // Container/frame
  const childrenJsx = node.children
    .map((c) => nodeToJsx(c, depth + 1))
    .join("\n");

  if (!childrenJsx) {
    return `${indent}<div className="${classes}" />`;
  }

  return `${indent}<div className="${classes}">\n${childrenJsx}\n${indent}</div>`;
}

function escapeJsx(str: string): string {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/{/g, "&#123;").replace(/}/g, "&#125;");
}

export interface ConvertedComponent {
  name: string;
  code: string;
}

export function convertNodeToComponent(node: ParsedNode): ConvertedComponent {
  const name = sanitizeName(node.name) || "Component";
  const jsx = nodeToJsx(node, 2);

  const code = `import React from "react";

export default function ${name}() {
  return (
${jsx}
  );
}
`;

  return { name, code };
}

export function convertNodesToComponents(nodes: ParsedNode[]): ConvertedComponent[] {
  return nodes.map(convertNodeToComponent);
}
