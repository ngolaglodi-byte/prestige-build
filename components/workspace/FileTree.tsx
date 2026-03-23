"use client";

import { useState, useCallback } from "react";
import { useFileTree } from "@/lib/store/fileTree";
import { TreeNode } from "./TreeNode";
import { useLoadFile } from "@/hooks/useLoadFile";
import { useTabs } from "@/lib/store/tabs";
import { useFileActions } from "@/hooks/useFileActions";

export function FileTree({ projectId }: { projectId: string }) {
  const { tree, selectedPath, selectFile, isLoading, error, clearError, refreshFiles } = useFileTree();
  const loadFile = useLoadFile(projectId);
  const { openTab } = useTabs();
  const { createFile, renameFile, deleteFile } = useFileActions(projectId);
  const [draggedPath, setDraggedPath] = useState<string | null>(null);

  const handleDrop = useCallback(
    (targetFolderPath: string) => {
      if (!draggedPath || draggedPath === targetFolderPath) return;
      const fileName = draggedPath.split("/").pop() || "";
      const newPath = targetFolderPath ? `${targetFolderPath}/${fileName}` : fileName;
      if (newPath !== draggedPath) {
        renameFile(draggedPath, newPath);
      }
      setDraggedPath(null);
    },
    [draggedPath, renameFile]
  );

  const handleRetry = useCallback(() => {
    clearError();
    refreshFiles(projectId);
  }, [clearError, refreshFiles, projectId]);

  // Show error state
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-400 text-sm mb-3">{error}</div>
        <button
          onClick={handleRetry}
          className="px-4 py-1.5 text-xs bg-accent hover:bg-accentDark text-white rounded transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading || !tree) {
    return (
      <div className="p-2 text-gray-400 text-sm flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        Chargement…
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-300 select-none">
      {/* Actions */}
      <div className="p-2 flex gap-2">
        <button
          className="text-xs text-green-400 hover:text-green-200"
          onClick={() => {
            const name = prompt("Nom du fichier :");
            if (!name) return;
            createFile(name);
          }}
        >
          + Fichier
        </button>
        <button
          className="text-xs text-blue-400 hover:text-blue-200"
          onClick={() => {
            const name = prompt("Nom du dossier :");
            if (!name) return;
            createFile(`${name}/.gitkeep`);
          }}
        >
          + Dossier
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
          const newName = prompt("Nouveau nom :", oldPath.split("/").pop());
          if (!newName) return;
          const newPath = oldPath.split("/").slice(0, -1).concat(newName).join("/");
          renameFile(oldPath, newPath);
        }}
        onDelete={(path: string) => {
          if (confirm("Supprimer ce fichier ?")) {
            deleteFile(path);
          }
        }}
        onDragStart={(path: string) => setDraggedPath(path)}
        onDrop={handleDrop}
        level={0}
      />
    </div>
  );
}
