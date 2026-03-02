import { describe, it, expect } from "vitest";
import { serializeToReact } from "@/lib/editor/code-serializer";
import type { CanvasNode } from "@/lib/editor/drag-drop-engine";

function makeNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: "n1",
    componentId: "unknown-component",
    props: {},
    classes: "",
    children: [],
    ...overrides,
  };
}

describe("code-serializer", () => {
  it("generates a basic React component with default name", () => {
    const result = serializeToReact([]);
    expect(result).toContain("export default function GeneratedPage()");
    expect(result).toContain('import React from "react"');
    expect(result).toContain("<main");
  });

  it("uses custom component name", () => {
    const result = serializeToReact([], "Dashboard");
    expect(result).toContain("export default function Dashboard()");
  });

  it("renders a div node for unknown componentId", () => {
    const node = makeNode({ classes: "p-4" });
    const result = serializeToReact([node]);
    expect(result).toContain('<div className="p-4">');
    expect(result).toContain("</div>");
  });

  it("renders text content from props.text", () => {
    const node = makeNode({ props: { text: "Hello World" } });
    const result = serializeToReact([node]);
    expect(result).toContain("Hello World");
  });

  it("renders nested children", () => {
    const child = makeNode({ id: "c1", classes: "text-sm" });
    const parent = makeNode({ id: "p1", classes: "flex", children: [child] });
    const result = serializeToReact([parent]);
    expect(result).toContain('className="flex"');
    expect(result).toContain('className="text-sm"');
  });

  it("renders self-closing img tag", () => {
    const node = makeNode({
      componentId: "image",
      props: { src: "/test.png", alt: "Test" },
      classes: "w-full",
    });
    const result = serializeToReact([node]);
    expect(result).toContain("<img");
    expect(result).toContain('src="/test.png"');
    expect(result).toContain('alt="Test"');
    expect(result).toContain("/>");
  });

  it("renders self-closing input tag", () => {
    const node = makeNode({
      componentId: "text-input",
      props: { placeholder: "Type here" },
      classes: "border",
    });
    const result = serializeToReact([node]);
    expect(result).toContain("<input");
    expect(result).toContain('placeholder="Type here"');
    expect(result).toContain("/>");
  });

  it("uses registered component tag (heading -> h2)", () => {
    const node = makeNode({
      componentId: "heading",
      props: { text: "Title" },
      classes: "text-2xl",
    });
    const result = serializeToReact([node]);
    expect(result).toContain("<h2");
    expect(result).toContain("Title");
  });
});
