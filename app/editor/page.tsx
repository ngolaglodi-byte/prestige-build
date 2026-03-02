"use client";

import React, { useState, useCallback } from "react";
import Canvas from "./components/Canvas";
import ComponentLibrary from "./components/ComponentLibrary";
import PropertyPanel from "./components/PropertyPanel";
import PageNavigator from "./components/PageNavigator";
import TopToolbar from "./components/TopToolbar";
import PreviewMode from "./components/PreviewMode";
import {
  type CanvasNode,
  nextNodeId,
  insertNode,
  removeNode,
  updateNode,
  findNode,
} from "@/lib/editor/drag-drop-engine";
import { getComponentById } from "@/lib/editor/component-registry";
import { serializeToReact } from "@/lib/editor/code-serializer";
import { createPage, deletePage, updatePageTree, type EditorPage } from "@/lib/editor/page-manager";

export default function EditorPage() {
  const [pages, setPages] = useState<EditorPage[]>([createPage("Accueil")]);
  const [activePageId, setActivePageId] = useState(pages[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<CanvasNode[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
  const tree = activePage.tree;

  const pushHistory = useCallback(
    (newTree: CanvasNode[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newTree);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setPages((prev) => updatePageTree(prev, activePageId, newTree));
    },
    [history, historyIndex, activePageId]
  );

  const handleDrop = useCallback(
    (componentId: string, parentId: string | null) => {
      const def = getComponentById(componentId);
      if (!def) return;
      const node: CanvasNode = {
        id: nextNodeId(),
        componentId,
        props: { ...def.defaultProps },
        classes: def.defaultClasses,
        children: [],
      };
      pushHistory(insertNode(tree, parentId, node));
    },
    [tree, pushHistory]
  );

  const handleDelete = useCallback(
    (nodeId: string) => {
      setSelectedId(null);
      pushHistory(removeNode(tree, nodeId));
    },
    [tree, pushHistory]
  );

  const handleUpdate = useCallback(
    (nodeId: string, updates: { props?: Record<string, unknown>; classes?: string }) => {
      pushHistory(updateNode(tree, nodeId, updates));
    },
    [tree, pushHistory]
  );

  const selectedNode = selectedId ? findNode(tree, selectedId) : null;
  const generatedCode = serializeToReact(tree, activePage.name.replace(/\s+/g, ""));

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] text-[var(--foreground)]">
      <TopToolbar
        onUndo={() => {
          if (historyIndex > 0) {
            const newIdx = historyIndex - 1;
            setHistoryIndex(newIdx);
            setPages((prev) => updatePageTree(prev, activePageId, history[newIdx]));
          }
        }}
        onRedo={() => {
          if (historyIndex < history.length - 1) {
            const newIdx = historyIndex + 1;
            setHistoryIndex(newIdx);
            setPages((prev) => updatePageTree(prev, activePageId, history[newIdx]));
          }
        }}
        onSave={() => {
          /* persisted via state */
        }}
        onExport={() => {
          const blob = new Blob([generatedCode], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${activePage.name}.tsx`;
          a.click();
          URL.revokeObjectURL(url);
        }}
        onPreview={() => setShowPreview(true)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      <PageNavigator
        pages={pages}
        activePageId={activePageId}
        onSelect={setActivePageId}
        onAdd={() => {
          const p = createPage(`Page ${pages.length + 1}`);
          setPages((prev) => [...prev, p]);
          setActivePageId(p.id);
        }}
        onDelete={(id) => {
          if (pages.length <= 1) return;
          const updated = deletePage(pages, id);
          setPages(updated);
          if (activePageId === id) setActivePageId(updated[0].id);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left – Component Library */}
        <div className="w-56 border-r border-[var(--border)] flex-shrink-0">
          <ComponentLibrary />
        </div>

        {/* Center – Canvas */}
        <Canvas
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDrop={handleDrop}
        />

        {/* Right – Property Panel */}
        <div className="w-64 border-l border-[var(--border)] flex-shrink-0">
          <PropertyPanel node={selectedNode} onUpdate={handleUpdate} onDelete={handleDelete} />
        </div>
      </div>

      {showPreview && (
        <PreviewMode code={generatedCode} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
