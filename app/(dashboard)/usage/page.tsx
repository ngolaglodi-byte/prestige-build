"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";

type UsageByAction = {
  action: string;
  totalTokens: number;
  totalCredits: number;
  count: number;
};

type RecentActivity = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type UsageData = {
  plan: {
    id: string;
    name: string;
    limits: {
      aiGenerations: number;
      workspaceSizeMb: number;
      maxProjects: number;
    };
  };
  credits: {
    remaining: number;
    monthly: number;
  };
  aiGenerations: {
    used: number;
    limit: number;
  };
  workspaceActions: {
    count: number;
  };
  usageByAction: UsageByAction[];
  recentActivity: RecentActivity[];
};

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    "ai.generate.simple": "Génération IA — Simple",
    "ai.generate.moderate": "Génération IA — Modérée",
    "ai.generate.complex": "Génération IA — Complexe",
    "workspace.file.create": "Fichier créé",
    "workspace.file.update": "Fichier modifié",
    "workspace.file.delete": "Fichier supprimé",
    "workspace.file.rename": "Fichier renommé",
    "workspace.project.create": "Projet créé",
    "workspace.project.delete": "Projet supprimé",
    "workspace.project.rename": "Projet renommé",
    "workspace.project.duplicate": "Projet dupliqué",
    "workspace.preview.start": "Aperçu lancé",
    "workspace.preview.stop": "Aperçu arrêté",
    "workspace.export": "Export",
  };
  if (action.startsWith("credits.consume.")) {
    return `Crédits consommés — ${action.replace("credits.consume.", "")}`;
  }
  return labels[action] ?? action;
}

function progressPercent(used: number, limit: number): number {
  if (limit <= 0) return used > 0 ? 100 : 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function progressColor(percent: number): string {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-yellow-500";
  return "bg-accent";
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const aiPercent = data
    ? progressPercent(data.aiGenerations.used, data.aiGenerations.limit)
    : 0;

  const creditPercent = data
    ? progressPercent(
        data.credits.monthly - data.credits.remaining,
        data.credits.monthly
      )
    : 0;

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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Utilisation & Limites</h1>
        {data && (
          <p className="text-gray-400 mb-8">
            Plan actuel : <span className="text-accent font-semibold capitalize">{data.plan.name}</span>
          </p>
        )}

        {loading ? (
          <p className="text-gray-400">Chargement des données d&apos;utilisation…</p>
        ) : data ? (
          <div className="flex flex-col gap-8">

            {/* Générations IA */}
            <div className="premium-card p-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Générations IA</h2>
                <span className="text-sm text-gray-400">
                  {data.aiGenerations.used} / {data.aiGenerations.limit} ce mois
                </span>
              </div>
              <div className="w-full h-3 bg-surfaceLight rounded-smooth overflow-hidden">
                <div
                  className={`h-full ${progressColor(aiPercent)} transition-all`}
                  style={{ width: `${aiPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {data.aiGenerations.limit - data.aiGenerations.used} générations restantes
              </p>
            </div>

            {/* Crédits */}
            <div className="premium-card p-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Crédits</h2>
                <span className="text-sm text-gray-400">
                  {data.credits.remaining} / {data.credits.monthly} restants
                </span>
              </div>
              <div className="w-full h-3 bg-surfaceLight rounded-smooth overflow-hidden">
                <div
                  className={`h-full ${progressColor(creditPercent)} transition-all`}
                  style={{ width: `${creditPercent}%` }}
                />
              </div>
            </div>

            {/* Actions Workspace */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold mb-4">Actions Workspace</h2>
              <p className="text-gray-400 text-sm mb-4">
                {data.workspaceActions.count} actions ce mois
              </p>
              {data.usageByAction.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.usageByAction.map((u) => (
                    <div key={u.action} className="flex justify-between items-center border-b border-border/50 pb-2">
                      <span className="text-sm">{actionLabel(u.action)}</span>
                      <span className="text-sm text-gray-400">
                        {u.count} fois — {u.totalCredits} crédits
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune action enregistrée ce mois.</p>
              )}
            </div>

            {/* Limites du plan */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold mb-4">Limites du plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surfaceLight rounded-smooth p-4 text-center">
                  <p className="text-2xl font-bold text-accent">{data.plan.limits.aiGenerations}</p>
                  <p className="text-xs text-gray-400 mt-1">Générations IA / mois</p>
                </div>
                <div className="bg-surfaceLight rounded-smooth p-4 text-center">
                  <p className="text-2xl font-bold text-accent">
                    {data.plan.limits.workspaceSizeMb >= 1000
                      ? `${data.plan.limits.workspaceSizeMb / 1000} Go`
                      : `${data.plan.limits.workspaceSizeMb} Mo`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Espace de travail</p>
                </div>
                <div className="bg-surfaceLight rounded-smooth p-4 text-center">
                  <p className="text-2xl font-bold text-accent">
                    {data.plan.limits.maxProjects === -1 ? "∞" : data.plan.limits.maxProjects}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Projets max</p>
                </div>
              </div>
            </div>

            {/* Activité récente */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold mb-4">Activité récente</h2>
              {data.recentActivity.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {data.recentActivity.map((a) => (
                    <div key={a.id} className="flex justify-between items-center text-sm border-b border-border/30 pb-2">
                      <span>{actionLabel(a.action)}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(a.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Aucune activité récente.</p>
              )}
            </div>

            {/* Lien vers la facturation */}
            <div className="flex gap-4">
              <Link
                href="/billing"
                className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft text-sm"
              >
                Gérer l&apos;abonnement
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 border border-border rounded-smooth text-gray-300 hover:text-white premium-hover text-sm"
              >
                Comparer les plans
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Impossible de charger les données.</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
