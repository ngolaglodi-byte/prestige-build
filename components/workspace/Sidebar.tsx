"use client";

import { TreeNode } from "@/components/workspace/TreeNode";
import { FileNode } from "@/lib/store/fileTree";

export default function Sidebar({
  tree,
  activeFile,
  onSelect,
  onNewFile,
  onNewFolder,
  onDelete,
  onRename,
}: {
  tree: FileNode;
  activeFile: string | null;
  onSelect: (path: string) => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onDelete: (path: string) => void;
  onRename: (path: string) => void;
}) {
  return (
    <aside className="w-64 h-full bg-surface border-r border-border p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Files</h2>

      {/* ACTIONS */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={onNewFile}
          className="px-2 py-1 bg-accent text-black rounded text-sm"
        >
          + File
        </button>

        <button
          onClick={onNewFolder}
          className="px-2 py-1 bg-accent/50 text-black rounded text-sm"
        >
          + Folder
        </button>
      </div>

      {/* FILE TREE */}
      <div className="flex-1 overflow-auto">
        <TreeNode
          node={tree}
          activeFile={activeFile}
          onSelect={onSelect}
          onDelete={onDelete}
          onRename={onRename}
          level={0}
        />
      </div>
    </aside>
  );
}
