"use client";

import { LayoutDashboard, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function WorkspacePage() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Workspace</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Votre espace de développement intégré pour éditer, prévisualiser et déployer vos projets.
        </p>
      </div>

      {/* Premium placeholder */}
      <div className="premium-card p-12 text-center max-w-lg mx-auto">
        <LayoutDashboard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Sélectionnez un projet</h3>
        <p className="text-gray-400 text-sm mb-6">
          Ouvrez un projet existant pour accéder à votre workspace de développement complet avec éditeur de code, prévisualisation en temps réel et outils IA.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth transition-all text-sm font-medium"
        >
          Voir mes projets <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
