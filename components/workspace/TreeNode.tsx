"use client";

import { useState } from "react";
import { FileActionsMenu } from "./FileActionsMenu";

export function TreeNode({ node, activeFile, onSelect, onRename, onDelete, level }) {
  const [open, setOpen] = useState(true);

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
        className={`flex items-center justify-between py-1 px-2 rounded cursor-pointer ${
          activeFile === node.path ? "bg-accent text-black" : "hover:bg-white/5"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) setOpen(!open);
          else onSelect(node.path);
        }}
      >
        <span>{node.name}</span>

        {!isFolder && (
          <FileActionsMenu
            onRename={() => onRename(node.path)}
            onDelete={() => onDelete(node.path)}
          />
        )}
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
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
