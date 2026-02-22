import { create } from "zustand";
import { buildFileTree } from "@/lib/utils/buildFileTree";

export const useFileTree = create((set, get) => ({
  tree: null,
  files: [],
  selectedPath: null,

  refreshFiles: async (projectId) => {
    const res = await fetch(`/api/projects/${projectId}/files`);
    const data = await res.json();

    if (data.ok) {
      const tree = buildFileTree(data.files);
      set({ files: data.files, tree });
    }
  },

  selectFile: (path) => set({ selectedPath: path }),
}));
