// components/workspace/PreviewFrame.tsx
"use client";

import { useEffect, useState } from "react";
import {
  isWebContainerSupported,
  startWebContainerPreview,
} from "@/lib/preview/webcontainer";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

type Props = {
  projectId: string;
};

export function PreviewFrame({ projectId }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState(false);
  const workspaceFiles = useWorkspaceStore((s) => s.files);

  useEffect(() => {
    let cancelled = false;

    async function startPreview() {
      // Try WebContainer first
      if (isWebContainerSupported()) {
        try {
          let files = workspaceFiles;
          if (Object.keys(files).length === 0) {
            try {
              const res = await fetch(`/api/projects/${projectId}/files`);
              if (res.ok) {
                files = await res.json();
              }
            } catch (err) {
              console.warn("Échec du chargement des fichiers du projet :", err);
            }
          }

          if (cancelled) return;

          const { url } = await startWebContainerPreview({
            files,
            onServerReady: (serverUrl) => {
              if (!cancelled) setPreviewUrl(serverUrl);
            },
            onError: (msg) => {
              if (!cancelled) setError(msg);
            },
          });

          if (!cancelled) setPreviewUrl(url);
          return;
        } catch {
          if (cancelled) return;
          setFallbackWarning(true);
        }
      } else {
        setFallbackWarning(true);
      }

      // Fall back to localhost
      try {
        const res = await fetch(`/api/projects/${projectId}/preview/start`, {
          method: "POST",
        });
        if (!cancelled) {
          if (!res.ok) {
            setError("Impossible de démarrer l\u2019aperçu");
            return;
          }
          const data = await res.json();
          setPreviewUrl(`http://localhost:${data.port}`);
        }
      } catch {
        if (!cancelled) setError("Erreur de connexion à l\u2019aperçu");
      }
    }

    startPreview();
    return () => { cancelled = true; };
  }, [projectId, workspaceFiles]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm fade-in">
        {error}
      </div>
    );
  }

  if (!previewUrl) {
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
