"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

export default function OAuthConnectionsPage() {
  const [connected, setConnected] = useState(false);

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
      <div className="max-w-3xl mx-auto mt-16 px-6 fade-in">

        <h1 className="text-3xl font-bold tracking-tight mb-8">Connexions OAuth</h1>

        <div className="premium-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#24292F] rounded-smooth flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>

            <div>
              <h2 className="text-lg font-semibold">GitHub</h2>
              <p className="text-gray-400 text-sm">
                Connectez votre compte GitHub pour synchroniser vos dépôts et activer les déploiements.
              </p>
            </div>
          </div>

          <button
            onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-smooth premium-hover border ${
              connected
                ? "bg-accent border-accent shadow-soft"
                : "bg-surface border-border"
            }`}
          >
            {connected ? "Connecté" : "Connecter"}
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
