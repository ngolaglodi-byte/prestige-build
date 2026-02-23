"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

export default function WebhookSettingsPage() {
  const [endpoint, setEndpoint] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/settings");
      const { config } = await res.json();
      if (config) {
        setEndpoint(config.endpointUrl);
        setSecret(config.signingSecret);
      }
    } catch {
      showMessage("error", "Erreur lors du chargement de la configuration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!endpoint) {
      showMessage("error", "L'URL du endpoint est requise.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/webhooks/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointUrl: endpoint }),
      });
      if (res.ok) {
        const { config } = await res.json();
        setSecret(config.signingSecret);
        showMessage("success", "Configuration sauvegardée avec succès.");
      } else {
        showMessage("error", "Erreur lors de la sauvegarde.");
      }
    } catch {
      showMessage("error", "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/webhooks/test", { method: "POST" });
      if (res.ok) {
        showMessage("success", "Webhook de test envoyé avec succès !");
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Erreur lors de l'envoi du test.");
      }
    } catch {
      showMessage("error", "Erreur réseau.");
    } finally {
      setTesting(false);
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
          <Link href="/webhooks/logs" className="text-gray-300 hover:text-white premium-hover">
            Journaux
          </Link>
          <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
            Tableau de bord
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-16 px-6 fade-in">

        <h1 className="text-3xl font-bold tracking-tight mb-8">Paramètres Webhook</h1>

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

        {/* Endpoint */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">URL du Endpoint</h2>

          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://exemple.com/api/webhook"
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300 focus:outline-none focus:border-accent"
          />

          <p className="text-gray-400 text-sm">
            Cette URL recevra les événements de Prestige Build.
          </p>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>

        {/* Signing Secret */}
        {secret && (
          <div className="premium-card p-6 flex flex-col gap-4 mb-10">
            <h2 className="text-xl font-semibold">Clé de signature</h2>

            <div className="flex items-center gap-3">
              <input
                type={showSecret ? "text" : "password"}
                readOnly
                value={secret}
                className="flex-1 bg-surfaceLight border border-border rounded-smooth px-4 py-2 text-gray-300"
              />

              <button
                onClick={() => setShowSecret(!showSecret)}
                className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
              >
                {showSecret ? "Masquer" : "Afficher"}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  showMessage("success", "Clé copiée !");
                }}
                className="px-3 py-2 bg-surface rounded-smooth border border-border premium-hover"
              >
                Copier
              </button>
            </div>

            <p className="text-gray-400 text-sm">
              Utilisez cette clé pour vérifier la signature des événements reçus.
            </p>
          </div>
        )}

        {/* Test Webhook */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Tester le Webhook</h2>

          <p className="text-gray-400 text-sm">
            Envoyez un événement de test à votre endpoint pour vérifier la configuration.
          </p>

          <button
            onClick={handleTest}
            disabled={testing || !secret}
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit disabled:opacity-50"
          >
            {testing ? "Envoi en cours..." : "Envoyer un test"}
          </button>
        </div>

      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
