"use client";

import { useState, useEffect, useRef } from "react";
import { useLogsStore, LogEntry } from "@/lib/store/logsStore";

type LogTab = "build" | "runtime" | "ai" | "error";

interface Props {
  projectId: string;
}

export function LogsPanel({ projectId }: Props) {
  const [activeTab, setActiveTab] = useState<LogTab>("build");
  const { aiLogs, buildLogs, errorLogs, runtimeLogs, addBuildLog } = useLogsStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Connexion au flux de logs de build
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

  const tabs: { key: LogTab; label: string; count: number }[] = [
    { key: "build", label: "Build", count: buildLogs.length },
    { key: "runtime", label: "Exécution", count: runtimeLogs.length },
    { key: "ai", label: "IA", count: aiLogs.length },
    { key: "error", label: "Erreurs", count: errorLogs.length },
  ];

  const logsMap: Record<LogTab, LogEntry[]> = {
    build: buildLogs,
    runtime: runtimeLogs,
    ai: aiLogs,
    error: errorLogs,
  };

  const currentLogs = logsMap[activeTab];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentLogs, activeTab]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-white">
      {/* Onglets */}
      <div className="flex items-center border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              activeTab === tab.key
                ? "text-accent border-b-2 border-accent"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-[10px] text-gray-500">({tab.count})</span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => {
            const store = useLogsStore.getState();
            const clearMap: Record<LogTab, () => void> = {
              build: store.clearBuildLogs,
              runtime: store.clearRuntimeLogs,
              ai: store.clearAiLogs,
              error: store.clearErrorLogs,
            };
            clearMap[activeTab]();
          }}
          className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors mr-2"
          title="Effacer les logs"
        >
          Effacer
        </button>
      </div>

      {/* Contenu des logs */}
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
