"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function AccountSettingsPage() {
  const [name, setName] = useState("Glody");
  const [email, setEmail] = useState("you@example.com");

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
        <h1 className="text-3xl font-bold tracking-tight mb-8">Paramètres du compte</h1>

        <div className="flex flex-col gap-10">

          {/* Profil */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Profil</h2>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
              />
            </div>

            <button className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit">
              Enregistrer les modifications
            </button>
          </div>

          {/* Mot de passe */}
          <div className="premium-card p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Mot de passe</h2>

            <Link href="/auth/forgot" className="text-accent premium-hover">
              Réinitialiser votre mot de passe
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
