"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 6;

  async function loadProjects(opts?: { page?: number; search?: string }) {
    const currentPage = opts?.page ?? page;
    const currentSearch = opts?.search ?? search;

    setLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(pageSize),
      search: currentSearch,
    });

    const res = await fetch(`/api/projects/list?${params.toString()}`);
    const data = await res.json();

    setProjects(data.projects || []);
    setTotal(data.total || 0);
    setPage(data.page || 1);
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
    loadProjects({ page: 1 });
  }

  async function deleteProject(id: string) {
    const ok = confirm("Supprimer ce projet ?");
    if (!ok) return;

    await fetch("/api/projects/delete", {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    loadProjects();
  }

  async function renameProject(id: string, currentName: string) {
    const name = prompt("Nouveau nom du projet :", currentName);
    if (!name || name === currentName) return;

    await fetch("/api/projects/rename", {
      method: "POST",
      body: JSON.stringify({ id, name }),
    });

    loadProjects();
  }

  async function duplicateProject(id: string) {
    await fetch("/api/projects/duplicate", {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    loadProjects({ page: 1 });
  }

  async function toggleFavorite(id: string, isFavorite: boolean) {
    await fetch("/api/projects/favorite", {
      method: "POST",
      body: JSON.stringify({ id, isFavorite: !isFavorite }),
    });

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
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Vos Projets</h1>
          <p className="text-gray-400 mt-1">
            Gérez, recherchez et organisez tous vos espaces de travail Prestige Build.
          </p>
        </div>

        <button
          onClick={createProject}
          disabled={creating}
          className="self-start md:self-auto px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "Création…" : "Nouveau Projet"}
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher des projets…"
          className="flex-1 px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm"
        >
          Rechercher
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-400">Aucun projet pour le moment. Créez-en un !</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-5 bg-[#0D0D0D] border border-white/10 rounded-xl flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      Mis à jour le {new Date(project.updated_at).toLocaleString("fr-FR")}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleFavorite(project.id, project.is_favorite)}
                    className={`text-sm ${
                      project.is_favorite ? "text-yellow-400" : "text-gray-500"
                    }`}
                    title={project.is_favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    ★
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Link
                    href={`/workspace/${project.id}`}
                    className="px-3 py-1.5 text-xs bg-white/10 rounded-lg hover:bg-white/20"
                  >
                    Ouvrir
                  </Link>
                  <button
                    onClick={() => renameProject(project.id, project.name)}
                    className="px-3 py-1.5 text-xs bg-white/5 rounded-lg hover:bg-white/15"
                  >
                    Renommer
                  </button>
                  <button
                    onClick={() => duplicateProject(project.id)}
                    className="px-3 py-1.5 text-xs bg-white/5 rounded-lg hover:bg-white/15"
                  >
                    Dupliquer
                  </button>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="px-3 py-1.5 text-xs bg-red-600/80 rounded-lg hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Page {page} sur {totalPages} — {total} projets
            </span>

            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => loadProjects({ page: page - 1 })}
                className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => loadProjects({ page: page + 1 })}
                className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-40"
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
