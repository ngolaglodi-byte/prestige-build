"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

export default function ActivityLogPage() {
  const logs = [
    {
      id: 1,
      action: "Création d'un nouveau projet",
      detail: "Landing Page Starter",
      time: "Il y a 2 heures",
    },
    {
      id: 2,
      action: "Fichier modifié",
      detail: "src/App.tsx",
      time: "Hier",
    },
    {
      id: 3,
      action: "Membre d'équipe invité",
      detail: "sarah@example.com",
      time: "Il y a 3 jours",
    },
    {
      id: 4,
      action: "Code généré avec l'IA",
      detail: "Mise en page de la page d'accueil",
      time: "Il y a 1 semaine",
    },
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
      <div className="max-w-3xl mx-auto mt-16 px-6 fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Journal d&apos;activité</h1>

        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="premium-card p-4 flex justify-between items-center"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{log.action}</span>
                <span className="text-gray-400 text-sm">{log.detail}</span>
              </div>

              <span className="text-gray-500 text-sm">{log.time}</span>
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
