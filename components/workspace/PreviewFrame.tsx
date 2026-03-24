// components/workspace/PreviewFrame.tsx
"use client";

import { useEffect, useState } from "react";
import {
  isWebContainerSupported,
  startWebContainerPreview,
} from "@/lib/preview/webcontainer";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { isProductionEnvironment, isBrowserEnvironment } from "@/lib/utils/environment";

type Props = {
  projectId: string;
};

export function PreviewFrame({ projectId }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const workspaceFiles = useWorkspaceStore((s) => s.files);

  useEffect(() => {
    let cancelled = false;

    async function startPreview() {
      console.log("[PreviewFrame] Starting preview for project:", projectId);
      setIsLoading(true);
      setError(null);

      // Check if we're in a browser environment
      if (!isBrowserEnvironment()) {
        console.log("[PreviewFrame] Not in browser environment, skipping preview");
        setError("L'aperçu n'est disponible que dans le navigateur.");
        setIsLoading(false);
        return;
      }

      // Try WebContainer first (only in supported environments)
      const webContainerSupported = isWebContainerSupported();
      console.log("[PreviewFrame] WebContainer supported:", webContainerSupported);

      if (webContainerSupported) {
        try {
          let files = workspaceFiles;
          if (Object.keys(files).length === 0) {
            console.log("[PreviewFrame] No workspace files, fetching from API...");
            try {
              const res = await fetch(`/api/projects/${projectId}/files`);
              console.log("[PreviewFrame] API response status:", res.status);
              if (res.ok) {
                const data = await res.json();
                if (data.ok && Array.isArray(data.files)) {
                  // Convert array to Record<string, { content: string }>
                  files = data.files.reduce((acc: Record<string, { content: string }>, f: { path: string; content: string }) => {
                    acc[f.path] = { content: f.content };
                    return acc;
                  }, {});
                  console.log("[PreviewFrame] Fetched", Object.keys(files).length, "files");
                }
              }
            } catch (err) {
              console.warn("[PreviewFrame] Failed to load project files:", err);
            }
          }

          if (cancelled) return;

          console.log("[PreviewFrame] Starting WebContainer preview...");
          const { url } = await startWebContainerPreview({
            files,
            onServerReady: (serverUrl) => {
              console.log("[PreviewFrame] Server ready at:", serverUrl);
              if (!cancelled) {
                setPreviewUrl(serverUrl);
                setIsLoading(false);
              }
            },
            onError: (msg) => {
              console.error("[PreviewFrame] WebContainer error:", msg);
              if (!cancelled) {
                setError(msg);
                setIsLoading(false);
              }
            },
          });

          if (!cancelled) {
            setPreviewUrl(url);
            setIsLoading(false);
          }
          return;
        } catch (wcError) {
          console.warn("[PreviewFrame] WebContainer failed, falling back:", wcError);
          if (cancelled) return;
          setFallbackWarning(true);
        }
      } else {
        console.log("[PreviewFrame] WebContainer not supported, using fallback");
        setFallbackWarning(true);
      }

      // Fall back to localhost preview
      console.log("[PreviewFrame] Attempting localhost preview...");
      try {
        const res = await fetch(`/api/projects/${projectId}/preview/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        console.log("[PreviewFrame] Localhost preview response:", res.status);
        
        if (!cancelled) {
          if (!res.ok) {
            // In production, this is expected to fail - show a helpful message
            if (isProductionEnvironment()) {
              setError("L'aperçu local n'est pas disponible en production. Utilisez 'Déployer' pour voir votre site.");
            } else {
              setError("Impossible de démarrer l'aperçu");
            }
            setIsLoading(false);
            return;
          }
          const data = await res.json();
          setPreviewUrl(`http://localhost:${data.port}`);
          setIsLoading(false);
        }
      } catch (fetchError) {
        console.error("[PreviewFrame] Localhost preview failed:", fetchError);
        if (!cancelled) {
          if (isProductionEnvironment()) {
            setError("L'aperçu n'est pas disponible en production. Déployez votre projet pour le visualiser.");
          } else {
            setError("Erreur de connexion à l'aperçu");
          }
          setIsLoading(false);
        }
      }
    }

    startPreview();
    return () => { 
      cancelled = true;
    };
  }, [projectId, workspaceFiles]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm fade-in p-4 text-center">
        <div>
          <div className="text-2xl mb-2">🖥️</div>
          {error}
        </div>
      </div>
    );
  }

  if (isLoading || !previewUrl) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          Démarrage de l&apos;aperçu…
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {fallbackWarning && (
        <div className="bg-amber-900/40 border-b border-amber-700/40 px-4 py-2 text-amber-300 text-xs flex items-center gap-2">
          ⚠️ Preview cloud non disponible. Utilisation du serveur local.
        </div>
      )}
      <iframe
        src={previewUrl}
        className="w-full flex-1 border-none fade-in"
      />
    </div>
  );
}
