/**
 * Converts a visual canvas tree into React/TypeScript code.
 */

import type { CanvasNode } from "./drag-drop-engine";
import { getComponentById } from "./component-registry";

function indent(code: string, level: number): string {
  const spaces = "  ".repeat(level);
  return code
    .split("\n")
    .map((line) => spaces + line)
    .join("\n");
}

function nodeToJsx(node: CanvasNode, level: number): string {
  const def = getComponentById(node.componentId);
  const tag = def?.tag ?? "div";
  const classes = node.classes || def?.defaultClasses || "";
  const props = node.props;

  // Self-closing tags
  if (tag === "img" || tag === "input") {
    const attrs = [`className="${classes}"`];
    if (tag === "img") {
      attrs.push(`src="${props.src ?? "/placeholder.svg"}"`);
      attrs.push(`alt="${props.alt ?? ""}"`);
    }
    if (tag === "input") {
      attrs.push(`type="text"`);
      attrs.push(`placeholder="${props.placeholder ?? ""}"`);
    }
    return `<${tag} ${attrs.join(" ")} />`;
  }

  // Text content
  const textContent = typeof props.text === "string" ? props.text : "";
  const childrenJsx =
    node.children.length > 0
      ? "\n" + node.children.map((c) => indent(nodeToJsx(c, level + 1), level + 1)).join("\n") + "\n" + "  ".repeat(level)
      : textContent;

  return `<${tag} className="${classes}">${childrenJsx}</${tag}>`;
}

export function serializeToReact(tree: CanvasNode[], componentName: string = "GeneratedPage"): string {
  const body = tree.map((n) => indent(nodeToJsx(n, 2), 2)).join("\n");

  return `import React from "react";

export default function ${componentName}() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--foreground)] p-8">
${body}
    </main>
  );
}
`;
}
