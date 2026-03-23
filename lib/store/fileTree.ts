"use client";

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
  isLoading: boolean;
  error: string | null;
  refreshFiles: (projectId: string) => Promise<void>;
  selectFile: (path: string) => void;
  clearError: () => void;
}

export const useFileTree = create<FileTreeStore>((set) => ({
  tree: null,
  files: [],
  selectedPath: null,
  isLoading: false,
  error: null,

  refreshFiles: async (projectId: string) => {
    // Validate projectId before making API call
    if (!projectId || projectId.trim() === "") {
      console.error("[FileTree] refreshFiles called with invalid projectId");
      set({ isLoading: false, error: "ID de projet invalide." });
      return;
    }

    console.log("[FileTree] Fetching files for project");
    set({ isLoading: true, error: null });
    
    try {
      const apiUrl = `/api/projects/${projectId}/files`;
      
      const res = await fetch(apiUrl);
      console.log("[FileTree] Response status:", res.status);
      
      if (!res.ok) {
        const errorText = res.status === 401 
          ? "Non autorisé. Veuillez vous reconnecter."
          : res.status === 403 
          ? "Accès refusé à ce projet."
          : res.status === 404 
          ? "Projet non trouvé."
          : `Erreur serveur (${res.status})`;
        
        console.error("[FileTree] API error:", errorText);
        set({ isLoading: false, error: errorText });
        return;
      }
      
      const data = await res.json();
      console.log("[FileTree] Response ok:", data.ok, "files count:", Array.isArray(data.files) ? data.files.length : 0);

      if (data.ok) {
        const tree = buildFileTree(data.files);
        console.log("[FileTree] File tree built successfully");
        set({ files: data.files, tree, isLoading: false, error: null });
      } else {
        const errorMessage = data.error || "Impossible de charger les fichiers.";
        console.error("[FileTree] API returned error:", errorMessage);
        set({ isLoading: false, error: errorMessage });
      }
    } catch (err) {
      console.error("[FileTree] Network error:", err);
      set({ isLoading: false, error: "Erreur réseau. Veuillez réessayer." });
    }
  },

  selectFile: (path: string) => set({ selectedPath: path }),
  
  clearError: () => set({ error: null }),
}));
