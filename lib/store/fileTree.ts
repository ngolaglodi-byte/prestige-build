import { create } from "zustand";
import { buildFileTree, FileNode } from "@/lib/utils/buildFileTree";

export type { FileNode };

export interface FileRecord {
  path: string;
  content: string;
}

interface FileTreeStore {
  tree: FileNode | null;
  files: FileRecord[];
  selectedPath: string | null;
  refreshFiles: (projectId: string) => Promise<void>;
  selectFile: (path: string) => void;
}

export const useFileTree = create<FileTreeStore>((set) => ({
  tree: null,
  files: [],
  selectedPath: null,

  refreshFiles: async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}/files`);
    const data = await res.json();

    if (data.ok) {
      const tree = buildFileTree(data.files);
      set({ files: data.files, tree });
    }
  },

  selectFile: (path: string) => set({ selectedPath: path }),
}));
