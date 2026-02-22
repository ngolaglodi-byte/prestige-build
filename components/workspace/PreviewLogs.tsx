// components/workspace/PreviewLogs.tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  projectId: string;
};

export function PreviewLogs({ projectId }: Props) {
  const [logs, setLogs] = useState("");

  useEffect(() => {
    const es = new EventSource(
      `/api/projects/${projectId}/preview/logs`
    );

    es.onmessage = (event) => {
      setLogs((prev) => prev + event.data + "\n");
    };

    return () => es.close();
  }, [projectId]);

  return (
    <pre className="w-full h-full bg-black text-green-400 text-xs p-2 overflow-auto">
      {logs}
    </pre>
  );
}
