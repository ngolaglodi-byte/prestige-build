/**
 * Visual Sync — bidirectional synchronisation between
 * the visual drag-and-drop editor and the code editor.
 *
 * Converts a canvas tree (CanvasNode[]) to JSX/React source code
 * and parses JSX back into a canvas tree.
 */

import type { CanvasNode } from "./drag-drop-engine";
import { getComponentById } from "./component-registry";

// ---------------------------------------------------------------------------
// Canvas → Code (tree → JSX source)
// ---------------------------------------------------------------------------

function indentation(depth: number): string {
  return "  ".repeat(depth);
}

function propsToJsx(props: Record<string, unknown>): string {
  const entries = Object.entries(props).filter(
    ([k]) => k !== "text" && k !== "children"
  );
  if (entries.length === 0) return "";
  return (
    " " +
    entries
      .map(([k, v]) => {
        if (typeof v === "string") return `${k}="${v}"`;
        return `${k}={${JSON.stringify(v)}}`;
      })
      .join(" ")
  );
}

function nodeToJsx(node: CanvasNode, depth: number): string {
  const comp = getComponentById(node.componentId);
  const tag = comp?.tag ?? "div";
  const indent = indentation(depth);
  const classAttr = node.classes ? ` className="${node.classes}"` : "";
  const propsStr = propsToJsx(node.props);

  const textContent =
    typeof node.props.text === "string" ? node.props.text : "";

  if (node.children.length === 0 && !textContent) {
    // Self-closing tags for void elements
    if (["img", "input", "br", "hr"].includes(tag)) {
      return `${indent}<${tag}${classAttr}${propsStr} />`;
    }
    return `${indent}<${tag}${classAttr}${propsStr} />`;
  }

  const lines: string[] = [];
  lines.push(`${indent}<${tag}${classAttr}${propsStr}>`);

  if (textContent) {
    lines.push(`${indentation(depth + 1)}${textContent}`);
  }

  for (const child of node.children) {
    lines.push(nodeToJsx(child, depth + 1));
  }

  lines.push(`${indent}</${tag}>`);
  return lines.join("\n");
}

/**
 * Converts a canvas tree to a React component source string.
 */
export function canvasToCode(
  tree: CanvasNode[],
  componentName = "Page"
): string {
  const bodyLines = tree.map((n) => nodeToJsx(n, 2)).join("\n");

  return [
    `export default function ${componentName}() {`,
    "  return (",
    "    <>",
    bodyLines,
    "    </>",
    "  );",
    "}",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Code → Canvas (JSX source → tree)
// ---------------------------------------------------------------------------

interface ParsedTag {
  tag: string;
  className: string;
  props: Record<string, string>;
  textContent: string;
  children: ParsedTag[];
}

const TAG_REGEX = /<(\w+)([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/g;
const CLASS_REGEX = /className="([^"]*)"/;
const PROP_REGEX = /(\w+)="([^"]*)"/g;

function parseTags(jsx: string): ParsedTag[] {
  const results: ParsedTag[] = [];
  let match: RegExpExecArray | null;

  const regex = new RegExp(TAG_REGEX.source, "g");

  while ((match = regex.exec(jsx)) !== null) {
    const tag = match[1];
    const attrsStr = match[2] ?? "";
    const innerContent = match[3] ?? "";

    const classMatch = attrsStr.match(CLASS_REGEX);
    const className = classMatch?.[1] ?? "";

    const props: Record<string, string> = {};
    let propMatch: RegExpExecArray | null;
    const propRegex = new RegExp(PROP_REGEX.source, "g");
    while ((propMatch = propRegex.exec(attrsStr)) !== null) {
      if (propMatch[1] !== "className") {
        props[propMatch[1]] = propMatch[2];
      }
    }

    const children = parseTags(innerContent);
    const textContent = children.length === 0 ? innerContent.trim() : "";

    results.push({ tag, className, props, textContent, children });
  }

  return results;
}

let codeParseCounter = 0;

function parsedToCanvas(parsed: ParsedTag): CanvasNode {
  const nodeProps: Record<string, unknown> = { ...parsed.props };
  if (parsed.textContent) {
    nodeProps.text = parsed.textContent;
  }

  return {
    id: `parsed_${++codeParseCounter}`,
    componentId: tagToComponentId(parsed.tag),
    props: nodeProps,
    classes: parsed.className,
    children: parsed.children.map(parsedToCanvas),
  };
}

function tagToComponentId(tag: string): string {
  const mapping: Record<string, string> = {
    section: "section",
    div: "container",
    nav: "nav-bar",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    p: "paragraph",
    img: "image",
    button: "button",
    input: "text-input",
    textarea: "textarea",
    a: "link",
  };
  return mapping[tag] ?? "container";
}

/**
 * Parses JSX source code into a canvas tree.
 * Best-effort parsing — handles simple, well-formed JSX.
 */
export function codeToCanvas(source: string): CanvasNode[] {
  codeParseCounter = 0;

  // Extract the JSX content inside return(...)
  const returnMatch = source.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*}/);
  const jsx = returnMatch?.[1] ?? source;

  // Remove fragment wrappers
  const cleaned = jsx
    .replace(/<>/g, "")
    .replace(/<\/>/g, "")
    .trim();

  const parsed = parseTags(cleaned);
  return parsed.map(parsedToCanvas);
}

// ---------------------------------------------------------------------------
// Sync helpers
// ---------------------------------------------------------------------------

/**
 * Applies a visual change to the source code by regenerating
 * the component from the updated tree.
 */
export function syncVisualToCode(
  tree: CanvasNode[],
  componentName?: string
): string {
  return canvasToCode(tree, componentName);
}

/**
 * Applies a code change to the canvas by re-parsing the source.
 */
export function syncCodeToVisual(source: string): CanvasNode[] {
  return codeToCanvas(source);
}
