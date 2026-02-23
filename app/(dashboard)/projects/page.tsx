"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Star,
  Clock,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  FolderKanban,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const pageSize = 9;

  async function loadProjects(opts?: { page?: number; search?: string }) {
    const currentPage = opts?.page ?? page;
    const currentSearch = opts?.search ?? search;
    setLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(pageSize),
      search: currentSearch,
    });
    try {
      const res = await fetch(`/api/projects/list?${params.toString()}`);
      const data = await res.json();
      setProjects(data.projects || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setCreating(false);
    loadProjects({ page: 1 });
  }

  async function deleteProject(id: string) {
    if (!confirm("Supprimer ce projet ?")) return;
    await fetch("/api/projects/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadProjects();
  }

  async function renameProject(id: string, currentName: string) {
    const name = prompt("Nouveau nom du projet :", currentName);
    if (!name || name === currentName) return;
    await fetch("/api/projects/rename", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name }) });
    loadProjects();
  }

  async function duplicateProject(id: string) {
    await fetch("/api/projects/duplicate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadProjects({ page: 1 });
  }

  async function toggleFavorite(id: string, isFavorite: boolean) {
    await fetch("/api/projects/favorite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isFavorite: !isFavorite }) });
    loadProjects();
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadProjects({ page: 1, search });
  }

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Gérez, recherchez et organisez vos projets.
          </p>
        </div>
        <button
          onClick={createProject}
          disabled={creating}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth transition-all text-sm font-medium disabled:opacity-50 self-start"
        >
          <Plus className="w-4 h-4" />
          {creating ? "Création…" : "Nouveau Projet"}
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-smooth px-3 py-2 focus-within:border-accent/50 transition-colors">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher des projets…"
            className="bg-transparent outline-none text-sm w-full placeholder:text-gray-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-surface border border-border rounded-smooth hover:bg-surfaceLight text-sm transition-colors">
          Rechercher
        </button>
      </form>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-surface border border-border rounded-xlSmooth animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="premium-card p-12 text-center max-w-lg mx-auto">
          <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-400 text-sm mb-6">
            {search
              ? "Aucun projet ne correspond à votre recherche."
              : "Créez votre premier projet pour commencer à construire avec Prestige Build."}
          </p>
          <button
            onClick={createProject}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Créer un projet
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="premium-card p-5 flex flex-col gap-3 group hover:border-accent/30 transition-all relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/workspace/${project.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Mis à jour le {new Date(project.updated_at).toLocaleDateString("fr-FR")}
                    </p>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleFavorite(project.id, project.is_favorite)}
                      className="p-1 rounded hover:bg-white/5 transition-colors"
                      title={project.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Star className={`w-4 h-4 ${project.is_favorite ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`} />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                        className="p-1 rounded hover:bg-white/5 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                      </button>
                      {openMenu === project.id && (
                        <div className="absolute right-0 top-8 w-40 bg-surface border border-border rounded-smooth shadow-strong z-10 py-1">
                          <button
                            onClick={() => { setOpenMenu(null); renameProject(project.id, project.name); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Renommer
                          </button>
                          <button
                            onClick={() => { setOpenMenu(null); duplicateProject(project.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" /> Dupliquer
                          </button>
                          <button
                            onClick={() => { setOpenMenu(null); deleteProject(project.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Page {page} sur {totalPages} — {total} projets</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => loadProjects({ page: page - 1 })}
                className="px-3 py-1.5 rounded-smooth bg-surface border border-border disabled:opacity-40 hover:bg-surfaceLight transition-colors"
              >
                Précédent
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => loadProjects({ page: page + 1 })}
                className="px-3 py-1.5 rounded-smooth bg-surface border border-border disabled:opacity-40 hover:bg-surfaceLight transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
