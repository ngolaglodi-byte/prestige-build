/**
 * Page manager: handles multi-page state for the visual editor.
 */

import type { CanvasNode } from "./drag-drop-engine";

export interface EditorPage {
  id: string;
  name: string;
  path: string;
  tree: CanvasNode[];
}

export function createPage(name: string): EditorPage {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return {
    id: crypto.randomUUID(),
    name,
    path: `/${slug}`,
    tree: [],
  };
}

export function renamePage(pages: EditorPage[], pageId: string, newName: string): EditorPage[] {
  return pages.map((p) =>
    p.id === pageId ? { ...p, name: newName } : p
  );
}

export function deletePage(pages: EditorPage[], pageId: string): EditorPage[] {
  return pages.filter((p) => p.id !== pageId);
}

export function updatePageTree(pages: EditorPage[], pageId: string, tree: CanvasNode[]): EditorPage[] {
  return pages.map((p) =>
    p.id === pageId ? { ...p, tree } : p
  );
}
