/**
 * Drag-and-drop engine utilities for the visual editor.
 * Manages the tree of placed components on the canvas.
 */

export interface CanvasNode {
  id: string;
  componentId: string;
  props: Record<string, unknown>;
  classes: string;
  children: CanvasNode[];
}

let idCounter = 0;
export function nextNodeId(): string {
  return `node_${++idCounter}`;
}
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Insert a new node as a child of the target container node (or root).
 */
export function insertNode(
  tree: CanvasNode[],
  parentId: string | null,
  node: CanvasNode
): CanvasNode[] {
  if (!parentId) return [...tree, node];

  return tree.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: [...n.children, node] };
    }
    return { ...n, children: insertNode(n.children, parentId, node) };
  });
}

/**
 * Remove a node by id from the tree.
 */
export function removeNode(tree: CanvasNode[], nodeId: string): CanvasNode[] {
  return tree
    .filter((n) => n.id !== nodeId)
    .map((n) => ({
      ...n,
      children: removeNode(n.children, nodeId),
    }));
}

/**
 * Update props/classes of a node by id.
 */
export function updateNode(
  tree: CanvasNode[],
  nodeId: string,
  updates: Partial<Pick<CanvasNode, "props" | "classes">>
): CanvasNode[] {
  return tree.map((n) => {
    if (n.id === nodeId) {
      return {
        ...n,
        ...(updates.props !== undefined && { props: { ...n.props, ...updates.props } }),
        ...(updates.classes !== undefined && { classes: updates.classes }),
      };
    }
    return { ...n, children: updateNode(n.children, nodeId, updates) };
  });
}

/**
 * Find a node by id.
 */
export function findNode(tree: CanvasNode[], nodeId: string): CanvasNode | null {
  for (const n of tree) {
    if (n.id === nodeId) return n;
    const found = findNode(n.children, nodeId);
    if (found) return found;
  }
  return null;
}
