// components/workspace/PreviewFrame.tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  projectId: string;
};

export function PreviewFrame({ projectId }: Props) {
  const [port, setPort] = useState<number | null>(null);

  useEffect(() => {
    const start = async () => {
      const res = await fetch(`/api/projects/${projectId}/preview/start`, {
        method: "POST",
      });
      const data = await res.json();
      setPort(data.port);
    };
    start();
  }, [projectId]);

  if (!port) return <div>Démarrage de l&apos;aperçu…</div>;

  return (
    <iframe
      src={`http://localhost:${port}`}
      className="w-full h-full border-none"
    />
  );
}
