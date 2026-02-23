"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type TemplateInfo = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
};

export default function NewProjectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateParam = searchParams.get("template") || "";
  const templateIdParam = searchParams.get("templateId") || "";

  const [name, setName] = useState("");
  const [template, setTemplate] = useState(templateParam || "next");
  const [creating, setCreating] = useState(false);
  const [communityTemplate, setCommunityTemplate] = useState<TemplateInfo | null>(null);

  const builtInTemplates = [
    { id: "next", label: "Starter Next.js" },
    { id: "react", label: "Starter React" },
    { id: "landing", label: "Page d'atterrissage" },
    { id: "ecommerce", label: "Starter E\u2011commerce" },
  ];

  // Load community template details if templateId is provided
  useEffect(() => {
    if (templateIdParam) {
      fetch(`/api/templates/${templateIdParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.template) {
            setCommunityTemplate(data.template);
            setTemplate("community");
            if (!name) setName(`${data.template.name} - Copie`);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIdParam]);

  // Pre-fill template if coming from marketplace
  useEffect(() => {
    if (templateParam) {
      setTemplate(templateParam);
    }
  }, [templateParam]);

  async function handleCreate() {
    if (!name) return;
    setCreating(true);

    if (template === "community" && templateIdParam) {
      // Create from community template
      const res = await fetch(`/api/templates/${templateIdParam}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/projects/${data.project.id}/workspace`);
        return;
      }
    } else {
      // Create regular project
      const res = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, template }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/projects/${data.project.id}/workspace`);
        return;
      }
    }

    setCreating(false);
  }

  return (
    <div className="fade-in max-w-2xl p-10">

      <h1 className="text-3xl font-bold tracking-tight mb-8">Créer un nouveau projet</h1>

      <div className="premium-card p-6 flex flex-col gap-6">

        {/* Nom */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Nom du projet</label>
          <input
            type="text"
            placeholder="Mon super projet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2"
          />
        </div>

        {/* Community Template Banner */}
        {communityTemplate && (
          <div className="p-4 bg-accent/10 border border-accent/30 rounded-smooth">
            <p className="text-sm text-accent font-medium">
              Création à partir du template : {communityTemplate.name}
            </p>
            <p className="text-xs text-gray-400 mt-1">{communityTemplate.description}</p>
            {communityTemplate.tags && communityTemplate.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {communityTemplate.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modèles intégrés */}
        {!communityTemplate && (
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Modèle</label>

            <div className="grid grid-cols-2 gap-3">
              {builtInTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-4 rounded-smooth border premium-hover text-left ${
                    template === t.id
                      ? "bg-accent/20 border-accent text-accent"
                      : "bg-surface border-border text-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Créer */}
        <button
          onClick={handleCreate}
          disabled={creating || !name}
          className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit disabled:opacity-50"
        >
          {creating ? "Création en cours…" : "Créer le projet"}
        </button>
      </div>
    </div>
  );
}
