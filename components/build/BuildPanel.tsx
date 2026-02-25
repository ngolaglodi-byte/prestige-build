"use client";

import { useState } from "react";
import { BuildTargetSelector } from "./BuildTargetSelector";
import { getBuildTargetConfig } from "@/lib/build/buildTargets";

interface BuildLog {
  msg: string;
  type: "info" | "error" | "warn";
}

interface Props {
  projectId: string;
  availableTargets?: string[];
}

type BuildStatus =
  | "idle"
  | "queued"
  | "building"
  | "success"
  | "failed"
  | "cancelled";

export function BuildPanel({ projectId, availableTargets }: Props) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("idle");
  const [buildId, setBuildId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [artifactUrl, setArtifactUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Build config
  const [appName, setAppName] = useState("");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [themeColor, setThemeColor] = useState("#000000");

  const targetConfig = selectedTarget
    ? getBuildTargetConfig(selectedTarget as never)
    : null;

  async function startBuild() {
    if (!selectedTarget) return;

    setBuildStatus("queued");
    setProgress(0);
    setLogs([]);
    setArtifactUrl(null);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/build/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target: selectedTarget,
            options: {
              appName: appName || undefined,
              version: appVersion || undefined,
              themeColor: themeColor || undefined,
            },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setBuildStatus("failed");
        setErrorMessage(data.error ?? "Erreur lors du démarrage du build");
        return;
      }

      setBuildId(data.buildId);
      setBuildStatus("building");

      // Poll status
      pollStatus(data.buildId);

      // Stream logs via SSE
      streamLogs(data.buildId);
    } catch {
      setBuildStatus("failed");
      setErrorMessage("Erreur réseau lors du démarrage du build");
    }
  }

  function pollStatus(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/build/${id}/status`
        );
        const data = await res.json();

        setProgress(data.progress ?? 0);

        if (
          data.status === "success" ||
          data.status === "failed" ||
          data.status === "cancelled"
        ) {
          clearInterval(interval);
          setBuildStatus(data.status);

          if (data.artifactUrl) setArtifactUrl(data.artifactUrl);
          if (data.errorMessage) setErrorMessage(data.errorMessage);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  }

  function streamLogs(id: string) {
    const es = new EventSource(
      `/api/projects/${projectId}/build/${id}/logs`
    );

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        setLogs((prev) => [
          ...prev,
          { msg: payload.msg, type: payload.type ?? "info" },
        ]);
      } catch {
        // ignore
      }
    };

    es.onerror = () => es.close();
  }

  async function cancelBuild() {
    if (!buildId) return;
    await fetch(`/api/projects/${projectId}/build/${buildId}/cancel`, {
      method: "POST",
    });
    setBuildStatus("cancelled");
  }

  const isRunning = buildStatus === "queued" || buildStatus === "building";

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <span className="text-lg">🔨</span>
        <h2 className="text-sm font-semibold text-white">Build universel</h2>
        {buildStatus !== "idle" && (
          <span
            className={`ml-auto text-[10px] px-2 py-0.5 rounded font-medium ${
              buildStatus === "success"
                ? "bg-green-900/40 text-green-300"
                : buildStatus === "failed"
                ? "bg-red-900/40 text-red-300"
                : buildStatus === "cancelled"
                ? "bg-gray-700/40 text-gray-300"
                : "bg-yellow-900/40 text-yellow-300"
            }`}
          >
            {buildStatus === "queued" && "En file…"}
            {buildStatus === "building" && "En cours…"}
            {buildStatus === "success" && "✅ Succès"}
            {buildStatus === "failed" && "❌ Échoué"}
            {buildStatus === "cancelled" && "Annulé"}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Target selector */}
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2">
            Cible de build
          </div>
          <BuildTargetSelector
            selectedTarget={selectedTarget}
            onSelect={setSelectedTarget}
            availableTargets={availableTargets}
          />
        </div>

        {/* Config form */}
        {selectedTarget && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="text-xs font-medium text-gray-400">
              Configuration — {targetConfig?.label}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">
                  Nom de l&apos;application
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Mon App"
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent/50"
                />
              </div>
              {(selectedTarget === "pwa" || selectedTarget === "web") && (
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">
                    Couleur du thème
                  </label>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-full h-8 bg-white/5 border border-white/10 rounded px-1 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isRunning && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && buildStatus === "failed" && (
          <div className="text-xs text-red-300 bg-red-900/20 border border-red-700/30 rounded p-3">
            ❌ {errorMessage}
          </div>
        )}

        {/* Download link */}
        {buildStatus === "success" && artifactUrl && (
          <a
            href={artifactUrl}
            download
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded bg-green-700/30 border border-green-600/40 text-green-200 text-sm font-medium hover:bg-green-700/50 transition-colors"
          >
            ⬇️ Télécharger {targetConfig?.label ?? "l'artefact"}
          </a>
        )}

        {/* Build logs */}
        {logs.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Journaux
            </div>
            <div className="bg-black/40 border border-white/5 rounded p-3 max-h-48 overflow-y-auto font-mono text-[11px] space-y-0.5">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "warn"
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  {log.msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        {isRunning ? (
          <button
            onClick={cancelBuild}
            className="flex-1 py-2 rounded bg-red-900/30 border border-red-700/40 text-red-300 text-sm hover:bg-red-900/50 transition-colors"
          >
            Annuler le build
          </button>
        ) : (
          <button
            onClick={startBuild}
            disabled={!selectedTarget}
            className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
              selectedTarget
                ? "bg-amber-700/40 border border-amber-600/50 text-amber-200 hover:bg-amber-700/60"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}
          >
            🔨 Lancer le build
          </button>
        )}
      </div>
    </div>
  );
}
