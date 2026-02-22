"use client";

import { useFileTree } from "@/lib/store/fileTree";
import { TreeNode } from "./TreeNode";
import { useLoadFile } from "@/hooks/useLoadFile";
import { useTabs } from "@/lib/store/tabs";
import { useFileActions } from "@/hooks/useFileActions";

export function FileTree({ projectId }: { projectId: string }) {
  const { tree, selectedPath, selectFile } = useFileTree();
  const loadFile = useLoadFile(projectId);
  const { openTab } = useTabs();
  const { createFile, renameFile, deleteFile } = useFileActions(projectId);

  if (!tree) {
    return <div className="p-2 text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="text-sm text-gray-300 select-none">
      {/* New File */}
      <div className="p-2">
        <button
          className="text-xs text-green-400 hover:text-green-200"
          onClick={() => {
            const name = prompt("File name:");
            if (!name) return;
            createFile(name);
          }}
        >
          + New File
        </button>
      </div>

      <TreeNode
        node={tree}
        activeFile={selectedPath}
        onSelect={(path: string) => {
          selectFile(path);
          loadFile(path);
          openTab(path);
        }}
        onRename={(oldPath: string) => {
          const newName = prompt("New name:", oldPath.split("/").pop());
          if (!newName) return;

          const newPath = oldPath.split("/").slice(0, -1).concat(newName).join("/");
          renameFile(oldPath, newPath);
        }}
        onDelete={(path: string) => {
          if (confirm("Delete this file?")) {
            deleteFile(path);
          }
        }}
        level={0}
      />
    </div>
  );
}
