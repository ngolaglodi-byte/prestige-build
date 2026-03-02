import { describe, it, expect, beforeEach } from "vitest";
import {
  insertNode,
  removeNode,
  updateNode,
  findNode,
  resetIdCounter,
  nextNodeId,
  type CanvasNode,
} from "@/lib/editor/drag-drop-engine";

function makeNode(overrides?: Partial<CanvasNode>): CanvasNode {
  return {
    id: nextNodeId(),
    componentId: "button",
    props: { text: "Click" },
    classes: "px-4 py-2",
    children: [],
    ...overrides,
  };
}

describe("editor/drag-drop-engine", () => {
  beforeEach(() => resetIdCounter());

  it("inserts a node at root level", () => {
    const node = makeNode();
    const tree = insertNode([], null, node);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe(node.id);
  });

  it("inserts a node into a parent", () => {
    const parent = makeNode({ id: "p1", componentId: "section", children: [] });
    const child = makeNode({ id: "c1" });
    const tree = insertNode([parent], "p1", child);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe("c1");
  });

  it("removes a node by id", () => {
    const a = makeNode({ id: "a" });
    const b = makeNode({ id: "b" });
    const tree = removeNode([a, b], "a");
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("b");
  });

  it("updates node props and classes", () => {
    const node = makeNode({ id: "n1" });
    const tree = updateNode([node], "n1", { props: { text: "Updated" }, classes: "bg-red" });
    expect(tree[0].props.text).toBe("Updated");
    expect(tree[0].classes).toBe("bg-red");
  });

  it("finds a nested node", () => {
    const child = makeNode({ id: "child" });
    const parent = makeNode({ id: "parent", children: [child] });
    const found = findNode([parent], "child");
    expect(found).not.toBeNull();
    expect(found?.id).toBe("child");
  });

  it("returns null for non-existent node", () => {
    expect(findNode([], "nope")).toBeNull();
  });
});
