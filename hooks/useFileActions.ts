"use client";

import { useFileTree } from "@/lib/store/fileTree";
import { useTabs } from "@/lib/store/tabs";

export function useFileActions(projectId: string) {
  const { refreshFiles } = useFileTree();
  const { closeTab } = useTabs();

  return {
    createFile: async (path: string) => {
      await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        body: JSON.stringify({ path, content: "" }),
      });

      refreshFiles(projectId);
    },

    renameFile: async (oldPath: string, newPath: string) => {
      await fetch(`/api/projects/${projectId}/files`, {
        method: "PATCH",
        body: JSON.stringify({ path: oldPath, newPath }),
      });

      refreshFiles(projectId);
    },

    deleteFile: async (path: string) => {
      await fetch(`/api/projects/${projectId}/files`, {
        method: "DELETE",
        body: JSON.stringify({ path }),
      });

      closeTab(path);
      refreshFiles(projectId);
    },
  };
}
