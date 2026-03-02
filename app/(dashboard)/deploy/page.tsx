"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { DeployPanel } from "@/components/deploy/DeployPanel";
import { Globe, Clock, ExternalLink } from "lucide-react";

interface Deployment {
  id: string;
  projectId: string;
  projectName: string;
  url?: string;
  date: string;
  status: "success" | "failed" | "building";
}

const STATUS_LABELS: Record<Deployment["status"], string> = {
  success: "Succès",
  failed: "Échec",
  building: "En cours",
};

const STATUS_COLORS: Record<Deployment["status"], string> = {
  success: "text-green-400 bg-green-400/10 border-green-400/30",
  failed: "text-red-400 bg-red-400/10 border-red-400/30",
  building: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
};

export default function DeployPage() {
  const [projectId, setProjectId] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [domainSaved, setDomainSaved] = useState(false);

  // Déploiements récents (simulés — à remplacer par un fetch réel)
  const recentDeployments: Deployment[] = [];

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomain.trim()) return;
    setDomainSaved(true);
    setTimeout(() => setDomainSaved(false), 3000);
  };

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
      <div className="flex flex-col items-center mt-12 fade-in px-6 pb-16 gap-8 w-full max-w-3xl mx-auto">
        <div className="w-full">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Déploiement</h1>
          <p className="text-gray-400">
            Déployez votre projet en un clic sur Vercel ou exportez-le vers GitHub.
          </p>
        </div>

        {/* Sélecteur de projet */}
        <div className="premium-card p-6 w-full flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Projet à déployer</h2>
          <input
            type="text"
            placeholder="Identifiant du projet (ex : proj_abc123)"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="bg-surface border border-border rounded-smooth px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
          />
        </div>

        {/* Panel de déploiement */}
        {projectId.trim() ? (
          <div className="premium-card p-6 w-full">
            <DeployPanel projectId={projectId.trim()} />
          </div>
        ) : (
          <div className="w-full border border-dashed border-border rounded-smooth p-8 text-center text-gray-500">
            Entrez un identifiant de projet pour commencer le déploiement.
          </div>
        )}

        {/* Domaine personnalisé */}
        <div className="premium-card p-6 w-full flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-accent" />
            <h2 className="text-lg font-semibold">Domaine personnalisé</h2>
          </div>
          <p className="text-sm text-gray-400">
            Associez votre propre nom de domaine à ce projet après déploiement.
          </p>
          <form onSubmit={handleSaveDomain} className="flex gap-3">
            <input
              type="text"
              placeholder="monsite.com"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="flex-1 bg-surface border border-border rounded-smooth px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-accent hover:bg-accentDark text-white rounded-smooth font-medium transition-all premium-hover"
            >
              {domainSaved ? "Enregistré ✓" : "Enregistrer"}
            </button>
          </form>
        </div>

        {/* Historique des déploiements */}
        <div className="premium-card p-6 w-full flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            <h2 className="text-lg font-semibold">Déploiements récents</h2>
          </div>

          {recentDeployments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucun déploiement récent. Lancez votre premier déploiement ci-dessus.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentDeployments.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between px-4 py-3 bg-surface rounded-smooth border border-border"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-white">{d.projectName}</span>
                    <span className="text-xs text-gray-500">{d.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[d.status]}`}
                    >
                      {STATUS_LABELS[d.status]}
                    </span>
                    {d.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-accentDark transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-8 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
