"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";

type Integration = {
  id: string;
  provider: string;
  active: boolean;
  config: Record<string, string>;
  createdAt: string;
};

type ProviderInfo = {
  key: string;
  name: string;
  description: string;
  bg: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
};

const providers: ProviderInfo[] = [
  {
    key: "github",
    name: "GitHub",
    description: "Connectez votre compte GitHub pour synchroniser vos dépôts et gérer vos projets directement depuis Prestige Build.",
    bg: "bg-[#24292F]",
    fields: [
      { key: "token", label: "Token d'accès personnel", placeholder: "ghp_xxxxxxxxxxxx", secret: true },
      { key: "username", label: "Nom d'utilisateur GitHub", placeholder: "votre-utilisateur" },
    ],
  },
  {
    key: "vercel",
    name: "Vercel",
    description: "Déployez automatiquement vos projets sur Vercel. Configurez votre token pour activer les déploiements en un clic.",
    bg: "bg-black",
    fields: [
      { key: "token", label: "Token Vercel", placeholder: "votre-token-vercel", secret: true },
      { key: "teamId", label: "ID d'équipe (optionnel)", placeholder: "team_xxxxxxxxxxxx" },
    ],
  },
  {
    key: "supabase",
    name: "Supabase",
    description: "Intégrez Supabase pour la base de données, l'authentification et le stockage dans vos projets générés.",
    bg: "bg-emerald-700",
    fields: [
      { key: "url", label: "URL du projet", placeholder: "https://xxxx.supabase.co" },
      { key: "anonKey", label: "Clé publique (anon)", placeholder: "eyJhbGciOi...", secret: true },
      { key: "serviceRoleKey", label: "Clé de service (optionnel)", placeholder: "eyJhbGciOi...", secret: true },
    ],
  },
  {
    key: "webhooks",
    name: "Webhooks",
    description: "Configurez des webhooks pour recevoir des notifications en temps réel sur les événements de vos projets.",
    bg: "bg-purple-700",
    fields: [
      { key: "endpointUrl", label: "URL du point de terminaison", placeholder: "https://votre-domaine.com/api/webhook" },
      { key: "secret", label: "Secret de signature", placeholder: "whsec_xxxxxxxxxxxx", secret: true },
    ],
  },
];

export default function IntegrationsPage() {
  const [integrationsList, setIntegrationsList] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  function loadIntegrations() {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((data) => {
        setIntegrationsList(data.integrations ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadIntegrations();
  }, []);

  function getIntegration(provider: string): Integration | undefined {
    return integrationsList.find((i) => i.provider === provider && i.active);
  }

  function openConfig(provider: ProviderInfo) {
    const existing = getIntegration(provider.key);
    const values: Record<string, string> = {};
    provider.fields.forEach((f) => {
      values[f.key] = existing?.config?.[f.key] ?? "";
    });
    setFormValues(values);
    setConfiguring(provider.key);
    setShowSecrets({});
  }

  async function saveConfig(providerKey: string) {
    setSaving(true);
    try {
      await fetch("/api/integrations", {
        method: "POST",
        body: JSON.stringify({ provider: providerKey, config: formValues }),
        headers: { "Content-Type": "application/json" },
      });
      loadIntegrations();
      setConfiguring(null);
    } catch {
      // Erreur silencieuse
    }
    setSaving(false);
  }

  async function disconnect(providerKey: string) {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter cette intégration ?")) return;
    await fetch("/api/integrations", {
      method: "DELETE",
      body: JSON.stringify({ provider: providerKey }),
      headers: { "Content-Type": "application/json" },
    });
    loadIntegrations();
    setConfiguring(null);
  }

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Retour au tableau de bord
        </Link>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto mt-16 px-6 fade-in w-full">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Intégrations</h1>

        <p className="text-gray-400 mb-10">
          Connectez vos services externes pour étendre les fonctionnalités de Prestige Build.
          Gérez vos intégrations GitHub, Vercel, Supabase et Webhooks.
        </p>

        {loading ? (
          <p className="text-gray-400">Chargement des intégrations…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((provider) => {
              const integration = getIntegration(provider.key);
              const isConnected = !!integration;
              const isConfiguring = configuring === provider.key;

              return (
                <div
                  key={provider.key}
                  className={`premium-card p-6 flex flex-col gap-4 transition-all ${
                    isConnected ? "border-green-600/40" : ""
                  }`}
                >
                  {/* En-tête */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 ${provider.bg} rounded-smooth flex items-center justify-center text-white font-bold text-sm`}
                      >
                        {provider.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{provider.name}</h2>
                        {isConnected && (
                          <span className="text-xs text-green-400">● Connecté</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm">{provider.description}</p>

                  {/* Formulaire de configuration */}
                  {isConfiguring && (
                    <div className="flex flex-col gap-3 mt-2">
                      {provider.fields.map((field) => (
                        <div key={field.key}>
                          <label className="text-sm text-gray-300 mb-1 block">
                            {field.label}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                              value={formValues[field.key] ?? ""}
                              onChange={(e) =>
                                setFormValues((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value,
                                }))
                              }
                              placeholder={field.placeholder}
                              className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300 text-sm focus:outline-none focus:border-accent"
                            />
                            {field.secret && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowSecrets((prev) => ({
                                    ...prev,
                                    [field.key]: !prev[field.key],
                                  }))
                                }
                                className="px-2 py-2 bg-surface rounded-smooth border border-border text-xs text-gray-400 hover:text-white"
                              >
                                {showSecrets[field.key] ? "Masquer" : "Afficher"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveConfig(provider.key)}
                          disabled={saving}
                          className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft text-sm"
                        >
                          {saving ? "Enregistrement…" : "Enregistrer"}
                        </button>
                        <button
                          onClick={() => setConfiguring(null)}
                          className="px-4 py-2 bg-surface rounded-smooth border border-border premium-hover text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {!isConfiguring && (
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <button
                        onClick={() => openConfig(provider)}
                        className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft text-sm"
                      >
                        {isConnected ? "Configurer" : "Connecter"}
                      </button>
                      {isConnected && (
                        <button
                          onClick={() => disconnect(provider.key)}
                          className="px-4 py-2 bg-red-600/30 text-red-300 rounded-smooth hover:bg-red-600/50 text-sm"
                        >
                          Déconnecter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pied de page */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
