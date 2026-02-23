"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface WebhookLog {
  id: string;
  event: string;
  endpointUrl: string;
  payload: Record<string, unknown>;
  status: string;
  statusCode: number | null;
  response: string | null;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  success: "Succès",
  failed: "Échoué",
  retrying: "Nouvelle tentative",
  pending: "En attente",
};

const statusColors: Record<string, string> = {
  success: "bg-green-600/20 text-green-400",
  failed: "bg-red-600/20 text-red-400",
  retrying: "bg-yellow-600/20 text-yellow-400",
  pending: "bg-blue-600/20 text-blue-400",
};

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [selected, setSelected] = useState<WebhookLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      showMessage("error", "Erreur lors du chargement des journaux.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRetry = async (logId: string) => {
    setRetrying(logId);
    try {
      const res = await fetch("/api/webhooks/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      if (res.ok) {
        showMessage("success", "Nouvelle tentative lancée.");
        await loadLogs();
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Erreur lors de la nouvelle tentative.");
      }
    } catch {
      showMessage("error", "Erreur réseau.");
    } finally {
      setRetrying(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-white flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <div className="flex items-center gap-4">
          <Link href="/webhooks/settings" className="text-gray-300 hover:text-white premium-hover">
            Paramètres
          </Link>
          <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
            Tableau de bord
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto mt-16 px-6 fade-in w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Journaux Webhook</h1>

        {message && (
          <div
            className={`mb-6 px-4 py-2 rounded-smooth text-sm ${
              message.type === "success"
                ? "bg-green-900/30 border border-green-600 text-green-400"
                : "bg-red-900/30 border border-red-600 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <p className="text-gray-400 mb-10">
          Consultez tous les événements webhook envoyés depuis Prestige Build.
        </p>

        {logs.length === 0 ? (
          <div className="premium-card p-8 text-center text-gray-400">
            Aucun événement webhook pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">

            {/* LEFT: Logs list */}
            <div className="col-span-1 flex flex-col gap-4">
              {logs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => setSelected(log)}
                  className={`premium-card p-4 text-left transition-all ${
                    selected?.id === log.id ? "border-accent shadow-soft" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{log.event}</span>

                    <span
                      className={`px-2 py-1 rounded-smooth text-xs ${
                        statusColors[log.status] || "bg-gray-600/20 text-gray-400"
                      }`}
                    >
                      {statusLabels[log.status] || log.status}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mt-1">Tentative {log.attempt}/{log.maxAttempts}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(log.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))}
            </div>

            {/* RIGHT: Log details */}
            <div className="col-span-2">
              {selected ? (
                <div className="premium-card p-6 flex flex-col gap-4">
                  <h2 className="text-xl font-semibold">Détails de l&apos;événement</h2>

                  <div className="flex justify-between">
                    <span className="text-gray-400">ID</span>
                    <span className="text-sm font-mono">{selected.id}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Événement</span>
                    <span>{selected.event}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Statut</span>
                    <span
                      className={`px-2 py-1 rounded-smooth text-xs ${
                        statusColors[selected.status] || "bg-gray-600/20 text-gray-400"
                      }`}
                    >
                      {statusLabels[selected.status] || selected.status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Code HTTP</span>
                    <span>{selected.statusCode ?? "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Tentative</span>
                    <span>{selected.attempt} / {selected.maxAttempts}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Endpoint</span>
                    <span className="text-sm font-mono truncate max-w-[300px]" title={selected.endpointUrl}>{selected.endpointUrl}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span>
                      {new Date(selected.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {(selected.status === "failed" || selected.status === "retrying") && (
                    <button
                      onClick={() => handleRetry(selected.id)}
                      disabled={retrying === selected.id}
                      className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit disabled:opacity-50"
                    >
                      {retrying === selected.id ? "Nouvelle tentative..." : "Réessayer"}
                    </button>
                  )}

                  <div className="h-px bg-border my-2"></div>

                  <h3 className="text-lg font-semibold">Contenu envoyé</h3>
                  <pre className="bg-surfaceLight border border-border rounded-smooth p-4 text-sm overflow-auto">
{JSON.stringify(selected.payload, null, 2)}
                  </pre>

                  {selected.response && (
                    <>
                      <h3 className="text-lg font-semibold">Réponse</h3>
                      <pre className="bg-surfaceLight border border-border rounded-smooth p-4 text-sm overflow-auto">
{selected.response}
                      </pre>
                    </>
                  )}
                </div>
              ) : (
                <div className="premium-card p-6 text-gray-400 text-center">
                  Sélectionnez un événement pour voir les détails.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
