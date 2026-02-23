"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

export default function AuditLogsPage() {
  const logs = [
    {
      id: 1,
      action: "Connexion utilisateur",
      detail: "Authentification réussie",
      time: "Il y a 2 heures",
      ip: "102.89.12.4",
    },
    {
      id: 2,
      action: "Paiement Mobile Money",
      detail: "Paiement Pawapay reçu (M-Pesa)",
      time: "Hier",
      ip: "102.89.12.4",
    },
    {
      id: 3,
      action: "Clé API régénérée",
      detail: "Clé secrète mise à jour",
      time: "Il y a 3 jours",
      ip: "102.89.12.4",
    },
    {
      id: 4,
      action: "Projet généré",
      detail: "Landing Page Starter",
      time: "Il y a 1 semaine",
      ip: "102.89.12.4",
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
      <div className="max-w-4xl mx-auto mt-16 px-6 fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Journaux d&apos;audit</h1>

        <div className="flex flex-col gap-4">
          {logs.map((log) => (
            <div key={log.id} className="premium-card p-4 flex justify-between">
              <div>
                <div className="font-semibold">{log.action}</div>
                <div className="text-gray-400 text-sm">{log.detail}</div>
                <div className="text-gray-500 text-xs mt-1">{log.time}</div>
              </div>

              <div className="text-gray-500 text-sm">
                IP: <span className="text-gray-300">{log.ip}</span>
              </div>
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
