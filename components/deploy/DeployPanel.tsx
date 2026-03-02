"use client";

import { useState, useCallback } from "react";
import {
  Rocket,
  Github,
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
} from "lucide-react";

interface DeployState {
  status: "idle" | "building" | "uploading" | "deploying" | "success" | "failed";
  logs: string;
  url?: string;
}

interface GitHubExportResult {
  repoUrl: string;
  filesExported: number;
  commitSha: string;
  branch: string;
}

interface Props {
  projectId: string;
}

export function DeployPanel({ projectId }: Props) {
  // Vercel deploy state
  const [deployState, setDeployState] = useState<DeployState>({ status: "idle", logs: "" });
  const [isDeploying, setIsDeploying] = useState(false);
  const [copied, setCopied] = useState(false);

  // GitHub export state
  const [showGitHub, setShowGitHub] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<GitHubExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const startDeploy = useCallback(async () => {
    if (isDeploying) return;
    setIsDeploying(true);
    setDeployState({ status: "building", logs: "Démarrage du déploiement…" });

    try {
      const res = await fetch(`/api/projects/${projectId}/deploy`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        setDeployState({ status: "failed", logs: err.error ?? "Erreur de déploiement" });
        setIsDeploying(false);
        return;
      }

      // Open SSE stream for status updates
      const eventSource = new EventSource(`/api/projects/${projectId}/deploy/status`);

      eventSource.onmessage = (e) => {
        try {
          const state = JSON.parse(e.data) as DeployState;
          setDeployState(state);

          if (state.status === "success" || state.status === "failed") {
            eventSource.close();
            setIsDeploying(false);
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsDeploying(false);
        setDeployState((prev) => ({
          ...prev,
          status: prev.status === "success" ? "success" : "failed",
          logs: prev.logs + "\nConnexion SSE interrompue",
        }));
      };
    } catch (err) {
      setDeployState({
        status: "failed",
        logs: err instanceof Error ? err.message : "Erreur inconnue",
      });
      setIsDeploying(false);
    }
  }, [isDeploying, projectId]);

  const copyUrl = () => {
    if (deployState.url) {
      navigator.clipboard.writeText(deployState.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportToGitHub = async () => {
    if (!githubToken || !repoName || isExporting) return;
    setIsExporting(true);
    setExportError(null);
    setExportResult(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/export/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubToken, repoName, isPrivate }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `Erreur HTTP ${res.status}`);
      }

      setExportResult(data.data as GitHubExportResult);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsExporting(false);
    }
  };

  const statusColors: Record<DeployState["status"], string> = {
    idle: "text-gray-400",
    building: "text-yellow-400",
    uploading: "text-blue-400",
    deploying: "text-purple-400",
    success: "text-green-400",
    failed: "text-red-400",
  };

  const statusLabels: Record<DeployState["status"], string> = {
    idle: "En attente",
    building: "Construction…",
    uploading: "Upload…",
    deploying: "Déploiement…",
    success: "Déployé ✓",
    failed: "Échec",
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-950 text-gray-100">
      {/* ── Vercel Deploy Section ──────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <Rocket size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Déployer sur Vercel</p>
            <p className="text-xs text-gray-500">Publication en un clic</p>
          </div>
          {deployState.status !== "idle" && (
            <span className={`ml-auto text-xs font-medium ${statusColors[deployState.status]}`}>
              {statusLabels[deployState.status]}
            </span>
          )}
        </div>

        <button
          onClick={startDeploy}
          disabled={isDeploying}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-all"
        >
          {isDeploying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{statusLabels[deployState.status]}</span>
            </>
          ) : deployState.status === "success" ? (
            <>
              <CheckCircle size={16} />
              <span>Re-déployer</span>
            </>
          ) : deployState.status === "failed" ? (
            <>
              <XCircle size={16} />
              <span>Réessayer</span>
            </>
          ) : (
            <>
              <Rocket size={16} />
              <span>Déployer maintenant</span>
            </>
          )}
        </button>

        {/* Deploy URL */}
        {deployState.url && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
            <span className="flex-1 text-xs text-green-400 truncate font-mono">
              {deployState.url}
            </span>
            <button
              onClick={copyUrl}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title="Copier l'URL"
            >
              <Copy size={14} />
            </button>
            <a
              href={deployState.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title="Ouvrir"
            >
              <ExternalLink size={14} />
            </a>
            {copied && (
              <span className="text-xs text-green-400 ml-1">Copié!</span>
            )}
          </div>
        )}

        {/* Logs */}
        {deployState.logs && (
          <pre className="text-xs text-gray-400 bg-gray-950 rounded-lg p-3 max-h-32 overflow-y-auto font-mono whitespace-pre-wrap border border-gray-800">
            {deployState.logs}
          </pre>
        )}
      </div>

      {/* ── GitHub Export Section ──────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
        <button
          onClick={() => setShowGitHub((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <Github size={16} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold">Exporter vers GitHub</p>
            <p className="text-xs text-gray-500">Pousser les fichiers dans un repo</p>
          </div>
          {showGitHub ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </button>

        {showGitHub && (
          <div className="px-4 pb-4 flex flex-col gap-3 border-t border-gray-800">
            {/* Token */}
            <div className="flex flex-col gap-1 mt-3">
              <label className="text-xs text-gray-400">Token GitHub (PAT)</label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-600 transition-colors"
              />
            </div>

            {/* Repo name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Nom du repository</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="mon-projet"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-600 transition-colors"
              />
            </div>

            {/* Private toggle */}
            <button
              onClick={() => setIsPrivate((v) => !v)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              {isPrivate ? (
                <Lock size={12} className="text-yellow-400" />
              ) : (
                <Unlock size={12} className="text-gray-400" />
              )}
              <span>{isPrivate ? "Repository privé" : "Repository public"}</span>
            </button>

            {/* Export button */}
            <button
              onClick={exportToGitHub}
              disabled={isExporting || !githubToken || !repoName}
              className="w-full py-2.5 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:border-gray-800 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isExporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Export en cours…</span>
                </>
              ) : (
                <>
                  <Github size={16} />
                  <span>Exporter</span>
                </>
              )}
            </button>

            {/* Export result */}
            {exportResult && (
              <div className="flex flex-col gap-2 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle size={14} />
                  <span>{exportResult.filesExported} fichiers exportés</span>
                </div>
                <a
                  href={exportResult.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink size={12} />
                  <span className="truncate">{exportResult.repoUrl}</span>
                </a>
                <p className="text-xs text-gray-500 font-mono">
                  Commit: {exportResult.commitSha.slice(0, 8)} (branche: {exportResult.branch})
                </p>
              </div>
            )}

            {/* Export error */}
            {exportError && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400">
                <XCircle size={14} className="flex-shrink-0" />
                <span>{exportError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeployPanel;
