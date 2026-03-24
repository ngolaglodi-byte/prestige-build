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
      console.error("[FileTree] refreshFiles called with invalid projectId:", projectId);
      set({ isLoading: false, error: "ID de projet invalide." });
      return;
    }

    console.log("[FileTree] Fetching files for project:", projectId);
    set({ isLoading: true, error: null });
    
    try {
      // Build the API URL - use relative path for Next.js API routes
      const apiUrl = `/api/projects/${encodeURIComponent(projectId)}/files`;
      console.log("[FileTree] API URL:", apiUrl);
      
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });
      
      console.log("[FileTree] Response status:", res.status, res.statusText);
      
      if (!res.ok) {
        let errorText: string;
        
        switch (res.status) {
          case 401:
            errorText = "Non autorisé. Veuillez vous reconnecter.";
            break;
          case 403:
            errorText = "Accès refusé à ce projet.";
            break;
          case 404:
            errorText = "Projet non trouvé.";
            break;
          case 500:
            errorText = "Erreur serveur interne. Veuillez réessayer.";
            break;
          default:
            errorText = `Erreur serveur (${res.status})`;
        }
        
        console.error("[FileTree] API error:", errorText);
        set({ isLoading: false, error: errorText });
        return;
      }
      
      // Parse response
      let data;
      try {
        const text = await res.text();
        console.log("[FileTree] Response text length:", text.length);
        
        if (!text) {
          console.error("[FileTree] Empty response from API");
          set({ isLoading: false, error: "Réponse vide du serveur." });
          return;
        }
        
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("[FileTree] JSON parse error:", parseError);
        set({ isLoading: false, error: "Erreur de parsing de la réponse." });
        return;
      }
      
      console.log("[FileTree] Response data - ok:", data.ok, "files count:", Array.isArray(data.files) ? data.files.length : "N/A");

      if (data.ok) {
        // Validate files array
        if (!Array.isArray(data.files)) {
          console.error("[FileTree] Invalid files format - expected array, got:", typeof data.files);
          set({ isLoading: false, error: "Format de fichiers invalide." });
          return;
        }
        
        try {
          const tree = buildFileTree(data.files);
          console.log("[FileTree] File tree built successfully with", data.files.length, "files");
          set({ files: data.files, tree, isLoading: false, error: null });
        } catch (buildError) {
          console.error("[FileTree] Error building file tree:", buildError);
          set({ isLoading: false, error: "Erreur lors de la construction de l'arborescence." });
        }
      } else {
        const errorMessage = data.error || "Impossible de charger les fichiers.";
        console.error("[FileTree] API returned error:", errorMessage);
        set({ isLoading: false, error: errorMessage });
      }
    } catch (err) {
      console.error("[FileTree] Network error:", err);
      
      // Check for specific error types
      if (err instanceof TypeError && err.message.includes("fetch")) {
        set({ isLoading: false, error: "Erreur réseau. Vérifiez votre connexion." });
      } else {
        set({ isLoading: false, error: "Erreur réseau. Veuillez réessayer." });
      }
    }
  },

  selectFile: (path: string) => set({ selectedPath: path }),
  
  clearError: () => set({ error: null }),
}));
