"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

type ApiKey = {
  id: string;
  keyPrefix: string;
  label: string;
  revoked: boolean;
  rateLimit: number;
  lastUsedAt: string | null;
  createdAt: string;
};

type UsageLog = {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  createdAt: string;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [usageLoading, setUsageLoading] = useState(false);

  function loadKeys() {
    fetch("/api/api-keys")
      .then((r) => r.json())
      .then((data) => {
        setKeys(data.keys ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function generateKey() {
    const label = prompt("Libellé de la clé :", "Par défaut");
    if (!label) return;
    const res = await fetch("/api/api-keys", {
      method: "POST",
      body: JSON.stringify({ label }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.key?.rawKey) {
      setNewRawKey(data.key.rawKey);
    }
    loadKeys();
  }

  async function revokeKey(id: string) {
    if (!confirm("Révoquer cette clé API ? Elle ne pourra plus être utilisée.")) return;
    await fetch("/api/api-keys", {
      method: "PATCH",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    loadKeys();
    if (selectedKeyId === id) {
      setSelectedKeyId(null);
      setUsageLogs([]);
    }
  }

  async function deleteKey(id: string) {
    if (!confirm("Supprimer définitivement cette clé API ?")) return;
    await fetch("/api/api-keys", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    loadKeys();
    if (selectedKeyId === id) {
      setSelectedKeyId(null);
      setUsageLogs([]);
    }
  }

  async function viewUsage(keyId: string) {
    setSelectedKeyId(keyId);
    setUsageLoading(true);
    try {
      const res = await fetch(`/api/api-keys/usage?keyId=${keyId}`);
      const data = await res.json();
      setUsageLogs(data.usage ?? []);
      setTotalRequests(data.totalRequests ?? 0);
    } catch {
      setUsageLogs([]);
      setTotalRequests(0);
    }
    setUsageLoading(false);
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Retour au tableau de bord
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-16 px-6 fade-in w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Clés API</h1>

        <p className="text-gray-400 mb-10">
          Gérez vos clés API pour accéder aux services et intégrations Prestige Build.
          Les clés sont hachées avant stockage pour votre sécurité.
        </p>

        {/* New key banner */}
        {newRawKey && (
          <div className="mb-8 p-5 bg-green-900/30 border border-green-600/40 rounded-smooth">
            <p className="text-green-300 font-semibold mb-2">
              ✅ Nouvelle clé générée — copiez-la maintenant, elle ne sera plus visible.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={newRawKey}
                className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-green-200 font-mono text-sm"
              />
              <button
                onClick={() => copy(newRawKey)}
                className="px-3 py-2 bg-green-700/50 rounded-smooth border border-green-600/40 premium-hover text-sm"
              >
                Copier
              </button>
              <button
                onClick={() => setNewRawKey(null)}
                className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <button
            onClick={generateKey}
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit"
          >
            Générer une nouvelle clé API
          </button>

          {loading ? (
            <p className="text-gray-400">Chargement des clés API…</p>
          ) : keys.length === 0 ? (
            <p className="text-gray-400">Aucune clé API. Générez-en une ci-dessus.</p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className={`premium-card p-6 flex flex-col gap-3 ${
                  k.revoked ? "opacity-60" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{k.label}</h2>
                    {k.revoked && (
                      <span className="text-xs px-2 py-0.5 bg-red-600/30 text-red-400 rounded-full">
                        Révoquée
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">
                    Créée le {new Date(k.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-400 font-mono text-sm">
                    {k.keyPrefix}••••••••••••
                  </code>

                  <span className="text-xs text-gray-500">
                    Limite : {k.rateLimit} req/min
                  </span>
                </div>

                {k.lastUsedAt && (
                  <p className="text-xs text-gray-500">
                    Dernière utilisation : {new Date(k.lastUsedAt).toLocaleString("fr-FR")}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-1">
                  {!k.revoked && (
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="px-3 py-1.5 text-xs bg-yellow-600/30 text-yellow-300 rounded-smooth hover:bg-yellow-600/50"
                    >
                      Révoquer
                    </button>
                  )}
                  <button
                    onClick={() => viewUsage(k.id)}
                    className="px-3 py-1.5 text-xs bg-white/10 rounded-smooth hover:bg-white/20"
                  >
                    Voir l&apos;utilisation
                  </button>
                  <button
                    onClick={() => deleteKey(k.id)}
                    className="px-3 py-1.5 text-xs bg-red-600/80 rounded-smooth hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Usage panel */}
        {selectedKeyId && (
          <div className="mt-10 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Suivi d&apos;utilisation
              </h2>
              <button
                onClick={() => {
                  setSelectedKeyId(null);
                  setUsageLogs([]);
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Fermer
              </button>
            </div>

            <div className="premium-card p-4 mb-4">
              <p className="text-gray-300">
                Total de requêtes : <span className="text-white font-bold">{totalRequests}</span>
              </p>
            </div>

            {usageLoading ? (
              <p className="text-gray-400">Chargement…</p>
            ) : usageLogs.length === 0 ? (
              <p className="text-gray-400">Aucune utilisation enregistrée pour cette clé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-border">
                      <th className="py-2 px-3">Point d&apos;accès</th>
                      <th className="py-2 px-3">Méthode</th>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border/50">
                        <td className="py-2 px-3 font-mono text-gray-300">{log.endpoint}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                            {log.method}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              log.statusCode < 400
                                ? "bg-green-600/30 text-green-300"
                                : "bg-red-600/30 text-red-300"
                            }`}
                          >
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-500">
                          {new Date(log.createdAt).toLocaleString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
