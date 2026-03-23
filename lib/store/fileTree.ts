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
    set({ isLoading: true, error: null });
    
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      
      if (!res.ok) {
        const errorText = res.status === 401 
          ? "Non autorisé. Veuillez vous reconnecter."
          : res.status === 403 
          ? "Accès refusé à ce projet."
          : res.status === 404 
          ? "Projet non trouvé."
          : `Erreur serveur (${res.status})`;
        
        set({ isLoading: false, error: errorText });
        throw new Error(errorText);
      }
      
      const data = await res.json();

      if (data.ok) {
        const tree = buildFileTree(data.files);
        set({ files: data.files, tree, isLoading: false, error: null });
      } else {
        const errorMessage = data.error || "Impossible de charger les fichiers.";
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur réseau. Veuillez réessayer.";
      set({ isLoading: false, error: errorMessage });
      throw err;
    }
  },

  selectFile: (path: string) => set({ selectedPath: path }),
  
  clearError: () => set({ error: null }),
}));
