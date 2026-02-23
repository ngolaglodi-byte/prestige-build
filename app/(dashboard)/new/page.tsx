"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("react");

  const templates = [
    { id: "react", label: "Application React" },
    { id: "next", label: "Application Next.js" },
    { id: "landing", label: "Page de destination" },
    { id: "ecommerce", label: "Starter E‑commerce" },
  ];

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
      <div className="flex flex-col items-center mt-20 fade-in px-6">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Créer un nouveau projet
        </h1>

        <p className="text-gray-400 mb-10 text-center max-w-xl">
          Choisissez un nom et un modèle. Prestige Build générera la structure complète du projet instantanément.
        </p>

        {/* Formulaire */}
        <div className="premium-card p-8 w-full max-w-xl flex flex-col gap-6">

          {/* Nom du projet */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Nom du projet</label>
            <input
              type="text"
              placeholder="Mon super projet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Modèles */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Modèle</label>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-3 rounded-smooth border transition-all premium-hover ${
                    template === t.id
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-border bg-surface text-gray-300 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/workspace/1"
            className="w-full text-center px-4 py-3 bg-accent rounded-smooth premium-hover shadow-soft text-lg"
          >
            Créer le projet
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
