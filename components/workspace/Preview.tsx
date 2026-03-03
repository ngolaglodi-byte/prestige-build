"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  isWebContainerSupported,
  startWebContainerPreview,
} from "@/lib/preview/webcontainer";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

type Status =
  | "building"
  | "running"
  | "error"
  | "restarting"
  | "crashed"
  | "limited"
  | "limit_reached"
  | "stopped_idle";

export default function Preview({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const [port, setPort] = useState<number | null>(null);
  const [logs, setLogs] = useState<{ msg: string; type: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [status, setStatus] = useState<Status>("building");
  const [resourceMessage, setResourceMessage] = useState<string | null>(null);
  const [restartToken, setRestartToken] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useWebContainer, setUseWebContainer] = useState(false);
  const [fallbackWarning, setFallbackWarning] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const workspaceFiles = useWorkspaceStore((s) => s.files);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // 🔥 Heartbeat vers le backend tant que le preview est actif (mode local uniquement)
  useEffect(() => {
    if (useWebContainer) return;
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
    }, 30_000); // toutes les 30s

    return () => clearInterval(interval);
  }, [projectId, status, useWebContainer]);

  // Localhost fallback preview
  const startLocalPreview = useCallback(() => {
    async function start() {
      setLogs([]);
      setError(null);
      setResourceMessage(null);

      const res = await fetch(`/api/projects/${projectId}/preview/start`);
      const data = await res.json();

      if (!data.ok && data.reason === "limit_reached") {
        setStatus("limit_reached");
        return;
      }

      setPort(data.port);
      setPreviewUrl(`http://localhost:${data.port}`);
      setStatus("building");

      const eventSource = new EventSource(
        `/api/projects/${projectId}/preview/logs`
      );

      eventSource.onmessage = (e) => {
        const payload = JSON.parse(e.data);
        const { msg, type } = payload;

        setLogs((prev) => [...prev, { msg, type }]);

        if (type === "error") {
          setError(msg);
          setStatus("error");
        }

        const lower = msg.toLowerCase();

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
          setError(null);
          setStatus("running");
        }
      };

      const key = `${userId}:${projectId}`;

      const ws = new WebSocket(
        `ws://localhost:7071/?key=${encodeURIComponent(key)}`
      );

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event === "restarting") {
            setStatus("restarting");
          }

          if (data.event === "reload") {
            setError(null);
            setResourceMessage(null);
            setStatus("running");
            setRefreshKey((k) => k + 1);
          }

          if (data.event === "crashed") {
            setStatus("crashed");
          }

          if (data.event === "resource_limit_exceeded") {
            setStatus("limited");
            setResourceMessage(
              `Limite de ressources dépassée (CPU\u00A0: ${Math.round(
                data.cpu
              )}\u00A0%, RAM\u00A0: ${Math.round(data.mem / (1024 * 1024))}\u00A0Mo)`
            );
          }

          if (data.event === "limit_reached") {
            setStatus("limit_reached");
          }

          if (data.event === "stopped_idle") {
            setStatus("stopped_idle");
          }
        } catch {
          // ignore
        }
      };
    }

    start();
  }, [userId, projectId]);

  // WebContainer-based or localhost preview
  useEffect(() => {
    if (!isWebContainerSupported()) {
      setFallbackWarning(true);
      startLocalPreview();
      return;
    }

    let cancelled = false;

    async function bootWebContainer() {
      setLogs([]);
      setError(null);
      setResourceMessage(null);
      setStatus("building");
      setUseWebContainer(true);

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

        const { url: wcUrl } = await startWebContainerPreview({
          files,
          onLog: (message, type) => {
            if (cancelled) return;
            setLogs((prev) => [...prev, { msg: message, type }]);
          },
          onServerReady: (serverUrl) => {
            if (cancelled) return;
            setPreviewUrl(serverUrl);
            setPort(1);
            setStatus("running");
            setError(null);
          },
          onError: (message) => {
            if (cancelled) return;
            setError(message);
            setStatus("error");
          },
        });

        if (cancelled) return;
        setPreviewUrl(wcUrl);
        setPort(1);
      } catch {
        if (cancelled) return;
        setUseWebContainer(false);
        setFallbackWarning(true);
        startLocalPreview();
      }
    }

    bootWebContainer();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, restartToken]);

  const renderStatusBar = () => {
    if (status === "building" || status === "restarting") {
      return (
        <div className="bg-yellow-900/40 border-b border-yellow-700 text-yellow-300 px-4 py-2 text-xs flex items-center gap-2">
          <span className="animate-spin h-3 w-3 border-2 border-yellow-400 border-t-transparent rounded-full"></span>
          {status === "building" ? "Construction de l'aperçu…" : "Redémarrage de l'aperçu…"}
        </div>
      );
    }

    if (status === "running") {
      return (
        <div className="bg-green-900/40 border-b border-green-700 text-green-300 px-4 py-2 text-xs flex items-center gap-2">
          <span className="h-2 w-2 bg-green-400 rounded-full"></span>
          En cours d&apos;exécution
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="bg-red-900/40 border-b border-red-700 text-red-300 px-4 py-2 text-xs flex items-center gap-2">
          <span className="h-2 w-2 bg-red-400 rounded-full"></span>
          Erreur de construction
        </div>
      );
    }

    if (status === "crashed") {
      return (
        <div className="bg-red-900/40 border-b border-red-700 text-red-300 px-4 py-2 text-xs flex items-center gap-2">
          <span className="h-2 w-2 bg-red-400 rounded-full"></span>
          Le serveur d&apos;aperçu a planté
        </div>
      );
    }

    if (status === "limited") {
      return (
        <div className="bg-orange-900/40 border-b border-orange-700 text-orange-300 px-4 py-2 text-xs flex items-center gap-2">
          <span className="h-2 w-2 bg-orange-400 rounded-full"></span>
          Limite de ressources dépassée
        </div>
      );
    }

    if (status === "limit_reached") {
      return (
        <div className="bg-purple-900/40 border-b border-purple-700 text-purple-300 px-4 py-2 text-xs flex items-center gap-2">
          <span className="h-2 w-2 bg-purple-400 rounded-full"></span>
          Limite d&apos;aperçu atteinte
        </div>
      );
    }

    if (status === "stopped_idle") {
      return (
        <div className="bg-slate-900/40 border-b border-slate-700 text-slate-300 px-4 py-2 text-xs flex items-center gap-2">
          <span className="h-2 w-2 bg-slate-400 rounded-full"></span>
          Aperçu arrêté pour inactivité
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0d0d0d] text-white">
      {renderStatusBar()}

      {status === "limit_reached" && (
        <div className="flex-1 flex items-center justify-center text-sm text-purple-200">
          <div className="text-center max-w-sm">
            <div className="text-lg font-semibold mb-2">
              Limite d&apos;aperçu atteinte
            </div>
            <div>
              Fermez un aperçu existant ou mettez à niveau votre plan pour en démarrer un nouveau.
            </div>
          </div>
        </div>
      )}

      {status === "stopped_idle" && (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-200">
          <div className="text-center max-w-sm space-y-3">
            <div className="text-lg font-semibold">
              Aperçu arrêté pour inactivité
            </div>
            <div className="text-xs text-slate-300">
              Pour économiser les ressources, les aperçus inactifs sont automatiquement arrêtés.
            </div>
            <button
              onClick={() => setRestartToken((k) => k + 1)}
              className="mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-xs font-medium"
            >
              Redémarrer l&apos;aperçu
            </button>
          </div>
        </div>
      )}

      {status !== "limit_reached" && status !== "stopped_idle" && (
        <>
          {/* Bannière de fallback */}
          {fallbackWarning && (
            <div className="bg-amber-900/40 border-b border-amber-700/40 px-4 py-2 text-amber-300 text-xs flex items-center gap-2">
              ⚠️ Preview cloud non disponible. Utilisation du serveur local.
            </div>
          )}

          {resourceMessage && (
            <div className="bg-[#2a1a00] border-b border-orange-700 p-3 text-orange-300 text-xs">
              {resourceMessage}
            </div>
          )}

          {error && (
            <div className="bg-[#2a0000] border-b border-red-700 p-4 text-red-300 text-sm h-48 overflow-auto shadow-lg">
              <div className="font-bold text-red-400 mb-2 text-sm">
                ❌ Erreur de construction
              </div>
              <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                {error}
              </pre>
            </div>
          )}

          <div className="bg-black text-xs h-40 overflow-auto border-b border-neutral-800 p-2 font-mono">
            {logs.map((l, i) => (
              <div
                key={i}
                className={
                  l.type === "error"
                    ? "text-red-400"
                    : l.type === "warn"
                    ? "text-yellow-400"
                    : "text-green-400"
                }
              >
                {l.msg}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex-1 bg-neutral-900 relative">
            {(error || status === "crashed" || status === "limited") && (
              <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm bg-neutral-900/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">
                    {status === "crashed"
                      ? "Le serveur d'aperçu a planté"
                      : status === "limited"
                      ? "Limite de ressources dépassée"
                      : "Erreur de construction"}
                  </div>
                  <div>
                    {status === "limited"
                      ? "Réduisez l'utilisation des ressources ou simplifiez le projet pour continuer."
                      : "Corrigez le problème pour recharger l'aperçu."}
                  </div>
                </div>
              </div>
            )}

            {port &&
              previewUrl &&
              !error &&
              status !== "crashed" &&
              status !== "limited" && (
                <iframe
                  key={refreshKey}
                  src={previewUrl}
                  className="w-full h-full border-0 bg-white"
                />
              )}
          </div>
        </>
      )}
    </div>
  );
}
