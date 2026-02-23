"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Sparkles,
  HardDrive,
  Plus,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects/list?page=1&pageSize=6&search=");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      // silencieux
    }
    setLoading(false);
  }

  async function createProject() {
    const name = prompt("Nom du projet :");
    if (!name) return;
    setCreating(true);
    await fetch("/api/projects/create", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    loadProjects();
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const stats = [
    {
      label: "Projets",
      value: projects.length,
      icon: FolderKanban,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Générations IA",
      value: "—",
      icon: Sparkles,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Stockage utilisé",
      value: "—",
      icon: HardDrive,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Bienvenue sur Prestige Build. Voici un aperçu de votre activité.
          </p>
        </div>

        <button
          onClick={createProject}
          disabled={creating}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth transition-all duration-200 font-medium text-sm disabled:opacity-50 self-start"
        >
          <Plus className="w-4 h-4" />
          {creating ? "Création…" : "Nouveau Projet"}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="premium-card p-5 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-smooth flex items-center justify-center ${stat.bg}`}
              >
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent projects */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Projets récents</h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm text-accent hover:text-accentLight transition-colors"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-surface border border-border rounded-xlSmooth animate-pulse"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="premium-card p-10 text-center">
            <FolderKanban className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">
              Aucun projet pour le moment
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Créez votre premier projet pour commencer à construire.
            </p>
            <button
              onClick={createProject}
              className="inline-flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accentDark text-white rounded-smooth transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <Link
                href={`/workspace/${project.id}`}
                key={project.id}
                className="premium-card p-5 hover:border-accent/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                    {project.name}
                  </h3>
                  {project.is_favorite && (
                    <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 fill-yellow-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Mis à jour le{" "}
                    {new Date(project.updated_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Activité récente</h2>
        <div className="premium-card p-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Clock className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">
              Votre activité récente apparaîtra ici.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
