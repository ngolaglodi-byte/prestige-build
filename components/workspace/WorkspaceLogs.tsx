"use client";

import { useState, useEffect, useRef } from "react";
import { useLogsStore, LogEntry } from "@/lib/store/logsStore";

type LogTab = "ai" | "build" | "error";

export function WorkspaceLogs({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<LogTab>("build");
  const { aiLogs, buildLogs, errorLogs, addBuildLog } = useLogsStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Connect to build log stream
  useEffect(() => {
    const es = new EventSource(`/api/projects/${projectId}/preview/logs`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addBuildLog(data.msg || event.data, data.type || "info");
      } catch {
        addBuildLog(event.data, "info");
      }
    };

    es.onerror = () => {
      addBuildLog("Connexion au flux de logs perdue", "error");
      es.close();
    };

    return () => es.close();
  }, [projectId, addBuildLog]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentLogs, activeTab]);

  const tabs: { key: LogTab; label: string }[] = [
    { key: "build", label: "Logs Build" },
    { key: "ai", label: "Logs IA" },
    { key: "error", label: "Logs Erreurs" },
  ];

  const currentLogs: LogEntry[] =
    activeTab === "ai" ? aiLogs : activeTab === "build" ? buildLogs : errorLogs;

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-white">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium ${
              activeTab === tab.key
                ? "text-accent border-b-2 border-accent"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Log content */}
      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {currentLogs.length === 0 && (
          <div className="text-gray-500 text-center mt-4">Aucun log disponible</div>
        )}
        {currentLogs.map((log, i) => (
          <div
            key={i}
            className={`py-0.5 ${
              log.type === "error"
                ? "text-red-400"
                : log.type === "warn"
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            <span className="text-gray-600 mr-2">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
