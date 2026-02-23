// components/workspace/PreviewFrame.tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  projectId: string;
};

export function PreviewFrame({ projectId }: Props) {
  const [port, setPort] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
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
          setPort(data.port);
        }
      } catch {
        if (!cancelled) setError("Erreur de connexion à l\u2019aperçu");
      }
    };
    start();
    return () => { cancelled = true; };
  }, [projectId]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-400 text-sm fade-in">
        {error}
      </div>
    );
  }

  if (!port) {
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
    <iframe
      src={`http://localhost:${port}`}
      className="w-full h-full border-none fade-in"
    />
  );
}
