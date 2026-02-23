"use client";

import { Sparkles, Zap, Clock } from "lucide-react";

export default function AIGenerationsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Générations IA</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Historique et gestion de vos générations de code par intelligence artificielle.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="premium-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-smooth bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Générations ce mois</p>
            <p className="text-2xl font-bold">—</p>
          </div>
        </div>
        <div className="premium-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-smooth bg-blue-500/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Crédits restants</p>
            <p className="text-2xl font-bold">—</p>
          </div>
        </div>
        <div className="premium-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-smooth bg-emerald-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Dernière génération</p>
            <p className="text-2xl font-bold">—</p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="premium-card p-12 text-center max-w-lg mx-auto">
        <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Aucune génération IA</h3>
        <p className="text-gray-400 text-sm mb-4">
          Utilisez le panneau IA dans votre workspace pour générer du code, refactoriser, ou expliquer du code existant.
        </p>
      </div>
    </div>
  );
}
