"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import AIPromptCreator from "@/components/AIPromptCreator";
import { useRouter } from "next/navigation";

export default function CreateProjectPage() {
  const router = useRouter();

  const handleProjectCreated = (projectId: string) => {
    router.push(`/workspace/${projectId}`);
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
      <div className="flex flex-col items-center mt-16 fade-in px-6 pb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4 text-center">
          Créer un projet avec l'IA
        </h1>
        <p className="text-gray-400 mb-10 text-center max-w-xl">
          Décrivez votre application en quelques mots et laissez Prestige Build générer la structure complète du projet.
          Aucune connaissance en code requise.
        </p>

        <div className="premium-card p-8 w-full max-w-2xl">
          <AIPromptCreator onProjectCreated={handleProjectCreated} />
        </div>

        <p className="mt-8 text-gray-500 text-sm">
          Préférez un template ?{" "}
          <Link href="/new" className="text-accent hover:underline">
            Créer un projet classique
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-auto py-8 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
