"use client";

import { useState } from "react";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("next");

  const templates = [
    { id: "next", label: "Starter Next.js" },
    { id: "react", label: "Starter React" },
    { id: "landing", label: "Page d'atterrissage" },
    { id: "ecommerce", label: "Starter E‑commerce" },
  ];

  return (
    <div className="fade-in max-w-2xl">

      <h1 className="text-3xl font-bold tracking-tight mb-8">Créer un nouveau projet</h1>

      <div className="premium-card p-6 flex flex-col gap-6">

        {/* Nom */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Nom du projet</label>
          <input
            type="text"
            placeholder="Mon super projet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2"
          />
        </div>

        {/* Modèles */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Modèle</label>

          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`p-4 rounded-smooth border premium-hover text-left ${
                  template === t.id
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-surface border-border text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Créer */}
        <button className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit">
          Créer le projet
        </button>
      </div>
    </div>
  );
}
