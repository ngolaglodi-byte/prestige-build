"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PreviewToolbar } from "./PreviewToolbar";
import { SandboxFrame } from "./SandboxFrame";
import { ErrorOverlay, PreviewError } from "./ErrorOverlay";
import { LogsPanel } from "./LogsPanel";
import { DeviceType } from "./DeviceSelector";
import { Framework } from "./FrameworkBadge";
import { useLogsStore } from "@/lib/store/logsStore";

type Status =
  | "building"
  | "running"
  | "error"
  | "restarting"
  | "crashed"
  | "limited"
  | "limit_reached"
  | "stopped_idle";

interface Props {
  userId: string;
  projectId: string;
}

export function PreviewEngine({ userId, projectId }: Props) {
  const [port, setPort] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("building");
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [framework, setFramework] = useState<Framework>("html");
  const [url, setUrl] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewError, setPreviewError] = useState<PreviewError | null>(null);
  const [showLogs, setShowLogs] = useState(true);
  const [restartToken, setRestartToken] = useState(0);
  const [showBuild, setShowBuild] = useState(false);

  const { addErrorLog, addRuntimeLog } = useLogsStore();
  const wsRef = useRef<WebSocket | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // Heartbeat pour maintenir le preview actif
  useEffect(() => {
    if (
      status === "crashed" ||
      status === "limited" ||
      status === "limit_reached" ||
      status === "stopped_idle"
    ) {
      return;
    }

    const interval = setInterval(() => {
      fetch(`/api/projects/${projectId}/preview/heartbeat`, {
        method: "POST",
      }).catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, [projectId, status]);

  // Démarrage et écoute des événements
  useEffect(() => {
    let cancelled = false;

    async function start() {
      setPreviewError(null);

      const res = await fetch(`/api/projects/${projectId}/preview/start`);
      const data = await res.json();

      if (cancelled) return;

      if (!data.ok && data.reason === "limit_reached") {
        setStatus("limit_reached");
        return;
      }

      if (data.port) {
        setPort(data.port);
        setUrl(`http://localhost:${data.port}`);
      }

      if (data.framework) {
        const fwMap: Record<string, Framework> = {
          nextjs: "nextjs",
          "next.js": "nextjs",
          react: "react",
          cra: "react",
          vite: "react",
          vue: "vue",
          svelte: "svelte",
          sveltekit: "svelte",
          astro: "astro",
          express: "node",
          node: "node",
          html: "html",
        };
        setFramework(fwMap[data.framework] ?? "html");
      }

      setStatus("building");

      // Flux SSE pour les logs de build
      const eventSource = new EventSource(
        `/api/projects/${projectId}/preview/logs`
      );
      esRef.current = eventSource;

      eventSource.onmessage = (e) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(e.data);
          const { msg, type } = payload;

          if (type === "error") {
            setStatus("error");
            setPreviewError({ message: msg });
            addErrorLog(msg, "error");
          }

          const lower = (msg as string).toLowerCase();

          if (
            lower.includes("building") ||
            lower.includes("waiting") ||
            lower.includes("starting") ||
            lower.includes("compiling")
          ) {
            setStatus("building");
          }

          if (
            type === "info" &&
            (lower.includes("compiled") ||
              lower.includes("ready") ||
              lower.includes("server running") ||
              (lower.includes("vite") && lower.includes("ready")))
          ) {
            setPreviewError(null);
            setStatus("running");
          }
        } catch {
          // ignorer
        }
      };

      // WebSocket pour le hot reload
      const key = `${userId}:${projectId}`;
      const ws = new WebSocket(
        `ws://localhost:7071/?key=${encodeURIComponent(key)}`
      );
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data);

          if (data.event === "restarting") {
            setStatus("restarting");
            addRuntimeLog("Redémarrage du serveur de prévisualisation…", "warn");
          }

          if (data.event === "reload") {
            setPreviewError(null);
            setStatus("running");
            setRefreshKey((k) => k + 1);
            addRuntimeLog("Rechargement de l'aperçu", "info");
          }

          if (data.event === "crashed") {
            setStatus("crashed");
            addErrorLog("Le serveur d'aperçu a planté", "error");
          }

          if (data.event === "resource_limit_exceeded") {
            setStatus("limited");
            addErrorLog(
              `Limite de ressources dépassée (CPU\u00A0: ${Math.round(
                data.cpu
              )}\u00A0%, RAM\u00A0: ${Math.round(data.mem / (1024 * 1024))}\u00A0Mo)`,
              "error"
            );
          }

          if (data.event === "limit_reached") {
            setStatus("limit_reached");
          }

          if (data.event === "stopped_idle") {
            setStatus("stopped_idle");
          }
        } catch {
          // ignorer
        }
      };
    }

    start();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      esRef.current?.close();
    };
  }, [userId, projectId, restartToken, addErrorLog, addRuntimeLog]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    addRuntimeLog("Rafraîchissement manuel", "info");
  }, [addRuntimeLog]);

  const handleError = useCallback(
    (error: PreviewError) => {
      setPreviewError(error);
      addErrorLog(error.message, "error");
    },
    [addErrorLog]
  );

  const handleDismissError = useCallback(() => {
    setPreviewError(null);
  }, []);

  const handleRestart = useCallback(() => {
    setRestartToken((k) => k + 1);
  }, []);

  // Vue limite atteinte
  if (status === "limit_reached") {
    return (
      <div className="h-full w-full flex flex-col bg-[#0d0d0d] text-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm animate-fadeIn">
            <div className="text-purple-400 text-4xl mb-4">⚠️</div>
            <div className="text-lg font-semibold text-purple-200 mb-2">
              Limite d&apos;aperçu atteinte
            </div>
            <div className="text-sm text-gray-400">
              Fermez un aperçu existant ou mettez à niveau votre plan pour en
              démarrer un nouveau.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue arrêté pour inactivité
  if (status === "stopped_idle") {
    return (
      <div className="h-full w-full flex flex-col bg-[#0d0d0d] text-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm space-y-3 animate-fadeIn">
            <div className="text-slate-400 text-4xl mb-2">💤</div>
            <div className="text-lg font-semibold text-slate-200">
              Aperçu arrêté pour inactivité
            </div>
            <div className="text-xs text-slate-400">
              Pour économiser les ressources, les aperçus inactifs sont
              automatiquement arrêtés.
            </div>
            <button
              onClick={handleRestart}
              className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-smooth bg-accent hover:bg-accentDark text-white text-xs font-medium transition-colors"
            >
              Redémarrer l&apos;aperçu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#0d0d0d] text-white overflow-hidden">
      {/* Barre d'outils */}
      <PreviewToolbar
        status={status}
        device={device}
        framework={framework}
        url={url}
        onDeviceChange={setDevice}
        onRefresh={handleRefresh}
        onUrlChange={setUrl}
        onBuild={() => setShowBuild((v) => !v)}
        onBuildForPlatform={(target) => {
          setShowBuild(true);
          addRuntimeLog(`Build déclenché pour : ${target}`, "info");
        }}
      />

      {/* Panneau de build (slide-down) */}
      {showBuild && (
        <div className="border-b border-white/10 bg-neutral-950 px-4 py-3 flex items-center justify-between animate-fadeIn">
          <div className="text-sm text-amber-300 font-medium">🔨 Build universel</div>
          <a
            href={`/workspace/build?projectId=${projectId}`}
            className="text-xs px-3 py-1.5 rounded bg-amber-700/30 border border-amber-600/40 text-amber-200 hover:bg-amber-700/50 transition-colors"
          >
            Ouvrir le panneau de build →
          </a>
          <button
            onClick={() => setShowBuild(false)}
            className="text-gray-500 hover:text-gray-300 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Zone principale : aperçu + logs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Iframe sandboxé */}
        <div className="flex-1 relative overflow-hidden">
          {port && url && status !== "crashed" && status !== "limited" ? (
            <SandboxFrame
              src={url}
              device={device}
              refreshKey={refreshKey}
              onError={handleError}
              onLoad={() => addRuntimeLog("Aperçu chargé avec succès", "info")}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              {status === "crashed" && (
                <div className="text-center animate-fadeIn">
                  <div className="text-red-400 text-4xl mb-4">💥</div>
                  <div className="text-lg font-semibold text-red-300 mb-2">
                    Le serveur d&apos;aperçu a planté
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    Corrigez le problème pour recharger l&apos;aperçu.
                  </div>
                  <button
                    onClick={handleRestart}
                    className="px-4 py-2 rounded-smooth bg-accent hover:bg-accentDark text-white text-xs font-medium transition-colors"
                  >
                    Redémarrer
                  </button>
                </div>
              )}
              {status === "limited" && (
                <div className="text-center animate-fadeIn">
                  <div className="text-orange-400 text-4xl mb-4">⚡</div>
                  <div className="text-lg font-semibold text-orange-300 mb-2">
                    Limite de ressources dépassée
                  </div>
                  <div className="text-sm text-gray-400">
                    Réduisez l&apos;utilisation des ressources ou simplifiez le
                    projet pour continuer.
                  </div>
                </div>
              )}
              {status !== "crashed" && status !== "limited" && (
                <div className="flex items-center gap-2 text-gray-400 text-sm animate-fadeIn">
                  <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  Démarrage de l&apos;aperçu…
                </div>
              )}
            </div>
          )}

          {/* Overlay d'erreur */}
          {previewError && (
            <ErrorOverlay error={previewError} onDismiss={handleDismissError} />
          )}
        </div>

        {/* Panneau de logs */}
        <div
          className={`border-t border-white/10 transition-all duration-300 ${
            showLogs ? "h-48" : "h-0"
          } overflow-hidden`}
        >
          <LogsPanel projectId={projectId} />
        </div>

        {/* Bouton toggle logs */}
        <button
          onClick={() => setShowLogs((v) => !v)}
          className="flex items-center justify-center py-1 bg-[#111] border-t border-white/10 text-gray-500 hover:text-gray-300 text-[10px] transition-colors"
        >
          {showLogs ? "▼ Masquer les journaux" : "▲ Afficher les journaux"}
        </button>
      </div>
    </div>
  );
}
