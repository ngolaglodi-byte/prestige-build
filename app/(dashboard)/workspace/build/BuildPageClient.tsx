"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BuildPanel } from "@/components/build/BuildPanel";
import { BuildHistory } from "@/components/build/BuildHistory";

export default function BuildPageClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const [activeTab, setActiveTab] = useState<"build" | "history">("build");
  const [availableTargets, setAvailableTargets] = useState<
    string[] | undefined
  >(undefined);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}/build/targets`)
      .then((res) => res.json())
      .then((data) => {
        if (data.availableTargets) {
          setAvailableTargets(data.availableTargets);
        }
      })
      .catch(() => {});
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0d0d0d] text-gray-400 text-sm">
        <div className="text-center space-y-2">
          <div className="text-2xl">🔨</div>
          <div className="font-medium">Paramètre manquant</div>
          <div className="text-xs text-gray-500">
            Le paramètre <code className="text-accent">projectId</code> est
            requis.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-neutral-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔨</span>
          <h1 className="text-base font-semibold">Build universel</h1>
        </div>
        <div className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded">
          {projectId}
        </div>

        {/* Tabs */}
        <div className="ml-auto flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("build")}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              activeTab === "build"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Nouveau build
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${
              activeTab === "history"
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "build" ? (
          <BuildPanel
            projectId={projectId}
            availableTargets={availableTargets}
          />
        ) : (
          <div className="h-full overflow-y-auto p-6">
            <BuildHistory projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}
