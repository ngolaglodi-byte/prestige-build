"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  is_public: boolean;
  usage_count: number;
  created_at: string;
  files: { path: string; content: string }[];
};

const CATEGORIES = ["Tous", "Web", "Mobile", "SaaS", "API", "E-commerce"];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Web");
  const [newTags, setNewTags] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newFiles, setNewFiles] = useState<{ path: string; content: string }[]>([
    { path: "index.html", content: "" },
  ]);
  const [saving, setSaving] = useState(false);

  async function loadTemplates() {
    setLoading(true);
    const params = new URLSearchParams({
      scope: "mine",
      search,
      category,
    });
    const res = await fetch(`/api/templates?${params.toString()}`);
    const data = await res.json();
    setTemplates(data.templates || []);
    setLoading(false);
  }

  async function createTemplate() {
    if (!newName || newFiles.length === 0) return;
    setSaving(true);

    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        description: newDescription,
        category: newCategory,
        tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
        files: newFiles.filter((f) => f.path),
        isPublic: newIsPublic,
      }),
    });

    setSaving(false);
    setShowCreate(false);
    setNewName("");
    setNewDescription("");
    setNewTags("");
    setNewFiles([{ path: "index.html", content: "" }]);
    loadTemplates();
  }

  async function importTemplate(jsonContent: string) {
    try {
      const parsed = JSON.parse(jsonContent);
      const res = await fetch("/api/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de l\u2019importation.");
        return;
      }

      setShowImport(false);
      loadTemplates();
    } catch {
      alert("Fichier JSON invalide.");
    }
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === "string") {
        importTemplate(content);
      }
    };
    reader.readAsText(file);
  }

  async function deleteTemplate(id: string) {
    const ok = confirm("Supprimer ce template ?");
    if (!ok) return;

    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    loadTemplates();
  }

  async function applyTemplate(template: Template) {
    const name = prompt("Nom du nouveau projet :", `${template.name} - Copie`);
    if (!name) return;

    const res = await fetch(`/api/templates/${template.id}/use`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      const data = await res.json();
      alert(`Projet « ${data.project.name} » créé avec succès !`);
    } else {
      alert("Erreur lors de la création du projet.");
    }
  }

  function addFile() {
    setNewFiles([...newFiles, { path: "", content: "" }]);
  }

  function removeFile(index: number) {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  }

  function updateFile(index: number, field: "path" | "content", value: string) {
    const updated = [...newFiles];
    updated[index] = { ...updated[index], [field]: value };
    setNewFiles(updated);
  }

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Mes Templates</h1>
          <p className="text-gray-400 mt-1">
            Créez, importez et gérez vos templates de projet.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm"
          >
            Importer JSON
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm"
          >
            Créer un template
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadTemplates();
          }}
          className="flex gap-3 flex-1"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher des templates…"
            className="flex-1 px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm"
          >
            Rechercher
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg border text-sm transition-all ${
                category === cat
                  ? "border-blue-500 bg-blue-500/20 text-blue-400"
                  : "border-white/10 bg-white/5 text-gray-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : templates.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p className="mb-4">Aucun template pour le moment.</p>
          <p className="text-sm">
            Créez-en un ou visitez le{" "}
            <Link href="/templates" className="text-blue-400 underline">
              Marketplace
            </Link>{" "}
            pour découvrir des templates publics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <div
              key={t.id}
              className="p-5 bg-[#0D0D0D] border border-white/10 rounded-xl flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold line-clamp-1">{t.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {t.category} · {t.usage_count} utilisation{t.usage_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    t.is_public
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {t.is_public ? "Public" : "Privé"}
                </span>
              </div>

              <p className="text-gray-400 text-sm flex-1 line-clamp-2">{t.description}</p>

              {t.tags && t.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {t.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  onClick={() => applyTemplate(t)}
                  className="px-3 py-1.5 text-xs bg-blue-600/80 rounded-lg hover:bg-blue-700"
                >
                  Utiliser
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="px-3 py-1.5 text-xs bg-red-600/80 rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Créer un template</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400">Nom *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Mon template"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description du template…"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-400">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm"
                  >
                    {CATEGORIES.filter((c) => c !== "Tous").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-400">Tags (séparés par des virgules)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Next.js, React, Tailwind"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newIsPublic}
                  onChange={(e) => setNewIsPublic(e.target.checked)}
                />
                <label htmlFor="isPublic" className="text-sm text-gray-400">
                  Publier dans le Marketplace (visible par tous)
                </label>
              </div>

              {/* Files */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Fichiers *</label>
                  <button
                    onClick={addFile}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    + Ajouter un fichier
                  </button>
                </div>

                {newFiles.map((file, i) => (
                  <div key={i} className="mb-3 p-3 bg-[#0D0D0D] border border-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={file.path}
                        onChange={(e) => updateFile(i, "path", e.target.value)}
                        placeholder="chemin/du/fichier.tsx"
                        className="flex-1 px-2 py-1 rounded bg-[#111] border border-white/10 text-xs"
                      />
                      {newFiles.length > 1 && (
                        <button
                          onClick={() => removeFile(i)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                    <textarea
                      value={file.content}
                      onChange={(e) => updateFile(i, "content", e.target.value)}
                      placeholder="Contenu du fichier…"
                      className="w-full px-2 py-1 rounded bg-[#111] border border-white/10 text-xs font-mono"
                      rows={4}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={createTemplate}
                  disabled={saving || !newName}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {saving ? "Création…" : "Créer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Importer un template</h2>
            <p className="text-sm text-gray-400 mb-4">
              Sélectionnez un fichier JSON contenant la définition du template.
              Le format attendu :
            </p>
            <pre className="text-xs bg-[#0D0D0D] p-3 rounded-lg mb-4 text-gray-300 overflow-x-auto">
{`{
  "name": "Mon Template",
  "description": "...",
  "category": "Web",
  "tags": ["Next.js"],
  "files": [
    { "path": "index.html", "content": "..." }
  ]
}`}
            </pre>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="mb-4 text-sm"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
