"use client";

import { useCallback } from "react";
import { useEditor } from "@/lib/store/editor";

export function useLoadFile(projectId: string) {
  const { loadFile } = useEditor();

  return useCallback(
    (path: string) => {
      if (!projectId) {
        console.warn("[useLoadFile] Cannot load file: projectId is undefined");
        return;
      }
      if (!path) {
        console.warn("[useLoadFile] Cannot load file: path is undefined");
        return;
      }
      console.log("[useLoadFile] Loading file:", path, "for project:", projectId);
      loadFile(projectId, path);
    },
    [projectId, loadFile]
  );
}
