import { describe, it, expect } from "vitest";
import {
  canvasToCode,
  codeToCanvas,
  syncVisualToCode,
  syncCodeToVisual,
} from "@/lib/editor/visual-sync";
import type { CanvasNode } from "@/lib/editor/drag-drop-engine";

describe("editor/visual-sync", () => {
  describe("canvasToCode", () => {
    it("generates a React component from an empty tree", () => {
      const code = canvasToCode([]);
      expect(code).toContain("export default function Page()");
      expect(code).toContain("return");
    });

    it("generates JSX for a simple node", () => {
      const tree: CanvasNode[] = [
        {
          id: "n1",
          componentId: "heading",
          props: { text: "Hello World" },
          classes: "text-2xl font-bold",
          children: [],
        },
      ];
      const code = canvasToCode(tree);
      expect(code).toContain("h2");
      expect(code).toContain('className="text-2xl font-bold"');
      expect(code).toContain("Hello World");
    });

    it("handles nested nodes", () => {
      const tree: CanvasNode[] = [
        {
          id: "n1",
          componentId: "section",
          props: {},
          classes: "p-6",
          children: [
            {
              id: "n2",
              componentId: "paragraph",
              props: { text: "Inner text" },
              classes: "text-sm",
              children: [],
            },
          ],
        },
      ];
      const code = canvasToCode(tree);
      expect(code).toContain("section");
      expect(code).toContain("Inner text");
    });

    it("uses custom component name", () => {
      const code = canvasToCode([], "Dashboard");
      expect(code).toContain("export default function Dashboard()");
    });

    it("handles void elements correctly", () => {
      const tree: CanvasNode[] = [
        {
          id: "n1",
          componentId: "image",
          props: { src: "/img.png", alt: "Photo" },
          classes: "rounded-lg",
          children: [],
        },
      ];
      const code = canvasToCode(tree);
      expect(code).toContain("img");
      expect(code).toContain('src="/img.png"');
    });
  });

  describe("codeToCanvas", () => {
    it("parses simple JSX back to canvas nodes", () => {
      const source = `export default function Page() {
  return (
    <>
      <h2 className="text-2xl">Title</h2>
    </>
  );
}`;
      const tree = codeToCanvas(source);
      expect(tree).toHaveLength(1);
      expect(tree[0].componentId).toBe("heading");
      expect(tree[0].classes).toBe("text-2xl");
    });

    it("handles self-closing elements", () => {
      const source = `export default function Page() {
  return (
    <>
      <img className="w-full" src="/photo.jpg" alt="Photo" />
    </>
  );
}`;
      const tree = codeToCanvas(source);
      expect(tree).toHaveLength(1);
      expect(tree[0].componentId).toBe("image");
    });
  });

  describe("syncVisualToCode / syncCodeToVisual", () => {
    it("round-trips basic structure", () => {
      const tree: CanvasNode[] = [
        {
          id: "n1",
          componentId: "button",
          props: { text: "Click me" },
          classes: "px-4 py-2",
          children: [],
        },
      ];
      const code = syncVisualToCode(tree, "MyComp");
      expect(code).toContain("export default function MyComp()");
      expect(code).toContain("Click me");

      const backToTree = syncCodeToVisual(code);
      expect(backToTree).toHaveLength(1);
      expect(backToTree[0].componentId).toBe("button");
    });
  });
});
