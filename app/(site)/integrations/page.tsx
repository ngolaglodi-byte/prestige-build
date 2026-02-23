"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";

type ConnectionState = {
  github: boolean;
  vercel: boolean;
  supabase: boolean;
  stripe: boolean;
  pawapay: boolean;
};

const DEFAULT_CONNECTIONS: ConnectionState = {
  github: false,
  vercel: false,
  supabase: false,
  stripe: false,
  pawapay: false,
};

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<ConnectionState>(DEFAULT_CONNECTIONS);

  // Charger les connexions sauvegardées
  useEffect(() => {
    const saved = localStorage.getItem("prestige-integrations");
    if (saved) {
      try {
        setConnections({ ...DEFAULT_CONNECTIONS, ...JSON.parse(saved) });
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const toggle = (key: keyof ConnectionState) => {
    const updated = { ...connections, [key]: !connections[key] };
    setConnections(updated);
    localStorage.setItem("prestige-integrations", JSON.stringify(updated));
  };

  const integrations = [
    {
      id: "github" as const,
      name: "GitHub",
      description: "Connectez votre compte GitHub pour exporter des dépôts et synchroniser le code.",
      connected: connections.github,
      color: "text-white",
      bg: "bg-[#24292F]",
    },
    {
      id: "vercel" as const,
      name: "Vercel",
      description: "Déployez vos projets instantanément avec l'intégration Vercel.",
      connected: connections.vercel,
      color: "text-white",
      bg: "bg-black",
    },
    {
      id: "supabase" as const,
      name: "Supabase",
      description: "Connectez votre base de données et l'authentification avec Supabase.",
      connected: connections.supabase,
      color: "text-white",
      bg: "bg-green-600",
    },
    {
      id: "stripe" as const,
      name: "Stripe",
      description: "Activez les paiements et la facturation via Stripe.",
      connected: connections.stripe,
      color: "text-white",
      bg: "bg-blue-600",
    },
    {
      id: "pawapay" as const,
      name: "PawaPay",
      description: "Recevez des paiements Mobile Money depuis l'Afrique (M-Pesa, Airtel, MTN…).",
      connected: connections.pawapay,
      color: "text-white",
      bg: "bg-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Retour au Dashboard
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-16 px-6 fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Intégrations</h1>

        <p className="text-gray-400 mb-10">
          Connectez des services externes pour enrichir votre expérience Prestige Build.
        </p>

        <div className="grid grid-cols-1 gap-6">
          {integrations.map((i) => (
            <div
              key={i.id}
              className="premium-card p-6 flex items-center justify-between"
            >
              {/* Left */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-smooth flex items-center justify-center ${i.bg}`}>
                  <span className={`font-bold ${i.color}`}>{i.name[0]}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-lg font-semibold">{i.name}</span>
                  <span className="text-gray-400 text-sm">{i.description}</span>
                </div>
              </div>

              {/* Right */}
              <button
                onClick={() => toggle(i.id)}
                className={`px-4 py-2 rounded-smooth premium-hover border ${
                  i.connected
                    ? "bg-accent border-accent shadow-soft"
                    : "bg-surface border-border"
                }`}
              >
                {i.connected ? "Connecté" : "Connecter"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
