"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BuiltInTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  source: "builtin";
};

type CommunityTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  usage_count: number;
  source: "community";
};

type Template = BuiltInTemplate | CommunityTemplate;

const CATEGORIES = ["Tous", "Web", "Mobile", "SaaS", "API", "E-commerce"];

const builtInTemplates: BuiltInTemplate[] = [
  {
    id: "landing",
    name: "Landing Page",
    description: "Page d'accueil moderne et responsive avec sections hero, fonctionnalités et CTA.",
    category: "Web",
    tags: ["Next.js", "Tailwind"],
    source: "builtin",
  },
  {
    id: "ecommerce",
    name: "E\u2011commerce Starter",
    description: "Interface e-commerce complète avec pages produits, panier et checkout.",
    category: "E-commerce",
    tags: ["React", "Stripe"],
    source: "builtin",
  },
  {
    id: "dashboard",
    name: "Admin Dashboard",
    description: "Dashboard d'administration complet avec graphiques, tables et gestion utilisateurs.",
    category: "SaaS",
    tags: ["Next.js", "Charts"],
    source: "builtin",
  },
  {
    id: "saas-starter",
    name: "SaaS Starter Kit",
    description: "Kit de démarrage SaaS avec authentification, billing et gestion des abonnements.",
    category: "SaaS",
    tags: ["Next.js", "Clerk", "PawaPay"],
    source: "builtin",
  },
  {
    id: "rest-api",
    name: "REST API",
    description: "API REST complète avec authentification JWT, validation et documentation.",
    category: "API",
    tags: ["Node.js", "Express"],
    source: "builtin",
  },
  {
    id: "blog",
    name: "Blog Platform",
    description: "Plateforme de blog avec éditeur Markdown, catégories et système de commentaires.",
    category: "Web",
    tags: ["Next.js", "MDX"],
    source: "builtin",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Portfolio développeur avec projets, expériences et formulaire de contact.",
    category: "Web",
    tags: ["React", "Framer Motion"],
    source: "builtin",
  },
  {
    id: "mobile-app",
    name: "App Mobile",
    description: "Application mobile cross-platform avec navigation, auth et stockage local.",
    category: "Mobile",
    tags: ["React Native", "Expo"],
    source: "builtin",
  },
  {
    id: "crm",
    name: "CRM",
    description: "Système de gestion de la relation client avec pipeline, contacts et rapports.",
    category: "SaaS",
    tags: ["Next.js", "Supabase"],
    source: "builtin",
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Place de marché multi-vendeurs avec système de paiement et avis.",
    category: "E-commerce",
    tags: ["Next.js", "PawaPay"],
    source: "builtin",
  },
  {
    id: "graphql-api",
    name: "GraphQL API",
    description: "API GraphQL avec schéma typé, resolvers et authentification.",
    category: "API",
    tags: ["Node.js", "Apollo"],
    source: "builtin",
  },
  {
    id: "chat-app",
    name: "Application Chat",
    description: "Application de chat en temps réel avec WebSocket, groupes et partage de fichiers.",
    category: "Web",
    tags: ["Next.js", "WebSocket"],
    source: "builtin",
  },
];

export default function TemplatesMarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [search, setSearch] = useState("");
  const [communityTemplates, setCommunityTemplates] = useState<CommunityTemplate[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  useEffect(() => {
    async function loadCommunity() {
      try {
        const res = await fetch("/api/templates?scope=public&pageSize=50");
        if (res.ok) {
          const data = await res.json();
          setCommunityTemplates(
            (data.templates || []).map((t: CommunityTemplate) => ({
              ...t,
              source: "community" as const,
            }))
          );
        }
      } catch {
        // Silently fail — built-in templates remain available
      }
      setLoadingCommunity(false);
    }
    loadCommunity();
  }, []);

  const allTemplates: Template[] = [...builtInTemplates, ...communityTemplates];

  const filtered = allTemplates.filter((t) => {
    const matchCategory = activeCategory === "Tous" || t.category === activeCategory;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="fade-in p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Marketplace de Templates</h1>
      <p className="text-gray-400 mb-8">
        Démarrez votre projet avec un template prêt à l&apos;emploi. Parcourez les templates
        intégrés et ceux partagés par la communauté.
      </p>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un template..."
          className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 flex-1 focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-smooth border text-sm premium-hover transition-all ${
                activeCategory === cat
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border bg-surface text-gray-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loadingCommunity && (
        <p className="text-gray-500 text-sm mb-4">Chargement des templates communautaires…</p>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((t) => (
          <div key={`${t.source}-${t.id}`} className="premium-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">{t.name}</div>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500 bg-surface px-2 py-1 rounded">
                  {t.category}
                </span>
                {t.source === "community" && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                    Communauté
                  </span>
                )}
              </div>
            </div>
            <div className="text-gray-400 text-sm flex-1">{t.description}</div>
            {t.source === "community" && (
              <div className="text-xs text-gray-500">
                {(t as CommunityTemplate).usage_count} utilisation
                {(t as CommunityTemplate).usage_count !== 1 ? "s" : ""}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {t.tags.map((tag) => (
                <span key={tag} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
            {t.source === "builtin" ? (
              <Link
                href={`/projects/new?template=${t.id}`}
                className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit text-sm"
              >
                Utiliser ce template
              </Link>
            ) : (
              <Link
                href={`/projects/new?templateId=${t.id}`}
                className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit text-sm"
              >
                Utiliser ce template
              </Link>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          Aucun template trouvé pour cette recherche.
        </div>
      )}
    </div>
  );
}
