import { describe, it, expect } from "vitest";
import { convertNodeToComponent, convertNodesToComponents } from "@/lib/figma/react-converter";
import type { ParsedNode } from "@/lib/figma/node-parser";

function node(overrides: Partial<ParsedNode> = {}): ParsedNode {
  return {
    id: "1", name: "Box", type: "frame",
    x: 0, y: 0, width: 200, height: 100,
    fills: [], opacity: 1, children: [],
    ...overrides,
  };
}

describe("react-converter – text nodes", () => {
  it("renders large text as h2", () => {
    const result = convertNodeToComponent(node({
      name: "Title", type: "text", text: "Hello", height: 32,
    }));
    expect(result.code).toContain("<h2");
    expect(result.code).toContain("Hello");
  });

  it("renders small text as p", () => {
    const result = convertNodeToComponent(node({
      name: "Body", type: "text", text: "Small text", height: 16,
    }));
    expect(result.code).toContain("<p");
    expect(result.code).toContain("Small text");
  });
});

describe("react-converter – image nodes", () => {
  it("renders image fill as img tag", () => {
    const result = convertNodeToComponent(node({
      name: "Photo",
      fills: [{ type: "IMAGE", imageRef: "img_1" }],
    }));
    expect(result.code).toContain("<img");
    expect(result.code).toContain("placeholder.svg");
  });
});

describe("react-converter – container nodes", () => {
  it("renders empty container as self-closing div", () => {
    const result = convertNodeToComponent(node({ name: "Empty" }));
    expect(result.code).toContain("<div");
  });

  it("renders container with children", () => {
    const result = convertNodeToComponent(node({
      name: "Parent",
      children: [
        node({ name: "Child1", type: "text", text: "Hi", height: 16 }),
        node({ name: "Child2" }),
      ],
    }));
    expect(result.code).toContain("Hi");
    expect(result.code).toContain("</div>");
  });
});

describe("react-converter – name sanitization", () => {
  it("sanitizes component names with special characters", () => {
    const result = convertNodeToComponent(node({ name: "My-Component 2!" }));
    expect(result.name).toBe("MyComponent2");
  });

  it("handles names starting with numbers", () => {
    const result = convertNodeToComponent(node({ name: "123Start" }));
    expect(result.name).toMatch(/^[A-Za-z]/);
  });
});

describe("react-converter – convertNodesToComponents", () => {
  it("converts multiple nodes", () => {
    const results = convertNodesToComponents([
      node({ name: "A" }),
      node({ name: "B" }),
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("A");
    expect(results[1].name).toBe("B");
  });
});
