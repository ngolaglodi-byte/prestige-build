"use client";

import { useState } from "react";
import { FileActionsMenu } from "./FileActionsMenu";
import { FileNode } from "@/lib/store/fileTree";

interface TreeNodeProps {
  node: FileNode;
  activeFile: string | null;
  onSelect: (path: string) => void;
  onRename: (path: string) => void;
  onDelete: (path: string) => void;
  onDragStart?: (path: string) => void;
  onDrop?: (targetFolder: string) => void;
  level: number;
}

export function TreeNode({ node, activeFile, onSelect, onRename, onDelete, onDragStart, onDrop, level }: TreeNodeProps) {
  const [open, setOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  if (node.name === "") {
    return (
      <div>
        {node.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            activeFile={activeFile}
            onSelect={onSelect}
            onRename={onRename}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDrop={onDrop}
            level={0}
          />
        ))}
      </div>
    );
  }

  const isFolder = node.type === "folder";

  return (
    <div className="group">
      <div
        draggable={!isFolder}
        onDragStart={(e) => {
          if (!isFolder && onDragStart) {
            e.dataTransfer.setData("text/plain", node.path);
            onDragStart(node.path);
          }
        }}
        onDragOver={(e) => {
          if (isFolder) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (isFolder && onDrop) {
            onDrop(node.path);
          }
        }}
        className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer ${
          activeFile === node.path ? "bg-accent text-black" : "hover:bg-white/5"
        } ${dragOver ? "bg-blue-900/30 border border-blue-500/50" : ""}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) setOpen(!open);
          else onSelect(node.path);
        }}
      >
        <span className="flex items-center gap-1">
          {isFolder && <span className="text-xs">{open ? "📂" : "📁"}</span>}
          {!isFolder && <span className="text-xs">📄</span>}
          {node.name}
        </span>

        <FileActionsMenu
          onRename={() => onRename(node.path)}
          onDelete={() => onDelete(node.path)}
        />
      </div>

      {isFolder && open && (
        <div>
          {node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              activeFile={activeFile}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDrop={onDrop}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
