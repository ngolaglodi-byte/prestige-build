import { describe, it, expect } from "vitest";
import {
  COMPONENT_REGISTRY,
  getComponentById,
  getComponentsByCategory,
} from "@/lib/editor/component-registry";
import type { ComponentDef } from "@/lib/editor/component-registry";
import {
  canvasToCode,
  codeToCanvas,
  syncVisualToCode,
  syncCodeToVisual,
} from "@/lib/editor/visual-sync";
import type { CanvasNode } from "@/lib/editor/drag-drop-engine";

function makeCanvas(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: "node-1",
    componentId: "section",
    props: {},
    classes: "p-6",
    children: [],
    ...overrides,
  };
}

describe("component registry – categories", () => {
  const categories: ComponentDef["category"][] = [
    "layout",
    "input",
    "display",
    "navigation",
  ];

  it.each(categories)(
    "has at least one component in the '%s' category",
    (category) => {
      const components = getComponentsByCategory(category);
      expect(components.length).toBeGreaterThanOrEqual(1);
    }
  );
});

describe("component registry – required fields", () => {
  it("every component has id, label, category, tag, and defaultClasses", () => {
    for (const comp of COMPONENT_REGISTRY) {
      expect(comp.id).toBeTruthy();
      expect(comp.label).toBeTruthy();
      expect(comp.category).toBeTruthy();
      expect(comp.tag).toBeTruthy();
      expect(typeof comp.defaultClasses).toBe("string");
      expect(typeof comp.isContainer).toBe("boolean");
      expect(typeof comp.defaultProps).toBe("object");
    }
  });

  it("all component ids are unique", () => {
    const ids = COMPONENT_REGISTRY.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("canvasToCode – JSX structure", () => {
  it("produces a valid function component", () => {
    const code = canvasToCode([makeCanvas()]);
    expect(code).toContain("export default function");
    expect(code).toContain("return (");
    expect(code).toContain("<>");
    expect(code).toContain("</>");
  });

  it("uses the component tag from the registry", () => {
    const code = canvasToCode([makeCanvas({ componentId: "button", props: { text: "Click" }, classes: "px-4" })]);
    expect(code).toContain("<button");
  });

  it("includes className attribute", () => {
    const code = canvasToCode([makeCanvas({ classes: "flex gap-4" })]);
    expect(code).toContain('className="flex gap-4"');
  });

  it("renders text content from props", () => {
    const code = canvasToCode([
      makeCanvas({ componentId: "heading", props: { text: "Hello World" }, classes: "text-2xl" }),
    ]);
    expect(code).toContain("Hello World");
  });

  it("accepts a custom component name", () => {
    const code = canvasToCode([makeCanvas()], "Dashboard");
    expect(code).toContain("function Dashboard()");
  });
});

describe("codeToCanvas – JSX parsing", () => {
  it("parses a simple self-closing tag", () => {
    const code = `export default function Page() {
  return (
    <>
      <img className="rounded" src="/img.png" alt="photo" />
    </>
  );
}`;
    const nodes = codeToCanvas(code);
    expect(nodes.length).toBeGreaterThanOrEqual(1);
    expect(nodes[0].componentId).toBe("image");
    expect(nodes[0].classes).toBe("rounded");
  });

  it("parses a tag with text content", () => {
    const code = `export default function Page() {
  return (
    <>
      <h2 className="text-xl">Title</h2>
    </>
  );
}`;
    const nodes = codeToCanvas(code);
    expect(nodes.length).toBeGreaterThanOrEqual(1);
    expect(nodes[0].props.text).toBe("Title");
    expect(nodes[0].componentId).toBe("heading");
  });
});

describe("round-trip: canvasToCode → codeToCanvas", () => {
  it("preserves top-level structure for a simple tree", () => {
    const original: CanvasNode[] = [
      makeCanvas({
        id: "r1",
        componentId: "section",
        classes: "p-6",
        children: [],
        props: {},
      }),
    ];
    const code = canvasToCode(original);
    const roundTripped = codeToCanvas(code);
    expect(roundTripped).toHaveLength(1);
    expect(roundTripped[0].componentId).toBe("section");
    expect(roundTripped[0].classes).toBe("p-6");
  });

  it("preserves text content through round-trip", () => {
    const original: CanvasNode[] = [
      makeCanvas({
        componentId: "paragraph",
        props: { text: "Lorem ipsum" },
        classes: "text-sm",
      }),
    ];
    const code = canvasToCode(original);
    const roundTripped = codeToCanvas(code);
    expect(roundTripped).toHaveLength(1);
    expect(roundTripped[0].props.text).toBe("Lorem ipsum");
  });
});

describe("getComponentsByCategory filtering", () => {
  it("returns only layout components for layout category", () => {
    const layouts = getComponentsByCategory("layout");
    expect(layouts.length).toBeGreaterThan(0);
    for (const comp of layouts) {
      expect(comp.category).toBe("layout");
    }
  });

  it("returns only navigation components for navigation category", () => {
    const navs = getComponentsByCategory("navigation");
    expect(navs.length).toBeGreaterThan(0);
    for (const comp of navs) {
      expect(comp.category).toBe("navigation");
    }
  });
});

describe("getComponentById", () => {
  it("returns the matching component", () => {
    const button = getComponentById("button");
    expect(button).toBeDefined();
    expect(button!.tag).toBe("button");
  });

  it("returns undefined for unknown id", () => {
    const result = getComponentById("nonexistent-widget");
    expect(result).toBeUndefined();
  });
});

describe("syncVisualToCode / syncCodeToVisual", () => {
  it("syncVisualToCode delegates to canvasToCode", () => {
    const tree = [makeCanvas()];
    const direct = canvasToCode(tree, "Test");
    const synced = syncVisualToCode(tree, "Test");
    expect(synced).toBe(direct);
  });

  it("syncCodeToVisual delegates to codeToCanvas", () => {
    const code = `export default function Page() {
  return (
    <>
      <p className="text-sm">Hi</p>
    </>
  );
}`;
    const direct = codeToCanvas(code);
    const synced = syncCodeToVisual(code);
    expect(synced).toHaveLength(direct.length);
    expect(synced[0].componentId).toBe(direct[0].componentId);
  });
});
