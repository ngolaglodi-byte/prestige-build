import { create } from "zustand";
import { buildFileTree } from "@/lib/utils/buildFileTree";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children: FileNode[] | null;
}

interface FileTreeStore {
  tree: FileNode | null;
  files: { path: string; content?: string }[];
  selectedPath: string | null;
  refreshFiles: (projectId: string) => Promise<void>;
  selectFile: (path: string) => void;
}

export const useFileTree = create<FileTreeStore>((set) => ({
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
