"use client";

import { useEffect, useState } from "react";
import { getBuildTargetConfig } from "@/lib/build/buildTargets";

interface BuildRecord {
  buildId: string;
  target: string;
  status: "queued" | "building" | "success" | "failed" | "cancelled";
  createdAt: string;
  completedAt?: string;
  artifactUrl?: string;
  errorMessage?: string;
  progress: number;
}

interface Props {
  projectId: string;
}

function formatDuration(start: string, end?: string): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}min`;
}

function StatusBadge({ status }: { status: BuildRecord["status"] }) {
  const cfg = {
    queued: "bg-gray-700/40 text-gray-300",
    building: "bg-yellow-900/40 text-yellow-300",
    success: "bg-green-900/40 text-green-300",
    failed: "bg-red-900/40 text-red-300",
    cancelled: "bg-slate-700/40 text-slate-300",
  };

  const labels = {
    queued: "En file",
    building: "En cours…",
    success: "Succès",
    failed: "Échoué",
    cancelled: "Annulé",
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${cfg[status]}`}>
      {labels[status]}
    </span>
  );
}

export function BuildHistory({ projectId }: Props) {
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBuilds() {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/build/history`
      );
      if (res.ok) {
        const data = await res.json();
        setBuilds(data.builds ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBuilds();
    // Refresh every 10s if any build is running
    const interval = setInterval(() => {
      setBuilds((prev) => {
        if (prev.some((b) => b.status === "queued" || b.status === "building")) {
          fetchBuilds();
        }
        return prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
        <div className="w-4 h-4 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mr-2" />
        Chargement…
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-3xl mb-3">🔨</div>
        <div className="text-sm text-gray-400">Aucun build précédent</div>
        <div className="text-xs text-gray-600 mt-1">
          Lancez votre premier build pour le voir apparaître ici
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {builds.map((build) => {
        const config = getBuildTargetConfig(build.target as never);

        return (
          <div
            key={build.buildId}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/3 border border-white/8 hover:bg-white/5 transition-colors"
          >
            <span className="text-lg flex-shrink-0">
              {config?.icon ?? "📦"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-200">
                  {config?.label ?? build.target}
                </span>
                <StatusBadge status={build.status} />
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {new Date(build.createdAt).toLocaleString("fr-FR")}
                {build.completedAt && (
                  <> · {formatDuration(build.createdAt, build.completedAt)}</>
                )}
              </div>
              {build.errorMessage && build.status === "failed" && (
                <div className="text-[10px] text-red-400 mt-0.5 truncate">
                  {build.errorMessage}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {build.status === "success" && build.artifactUrl && (
                <a
                  href={build.artifactUrl}
                  download
                  className="text-[10px] px-2 py-1 rounded bg-green-900/30 border border-green-700/30 text-green-300 hover:bg-green-900/50 transition-colors"
                >
                  ⬇️ Télécharger
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
