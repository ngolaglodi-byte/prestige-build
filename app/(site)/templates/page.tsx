"use client";

import Link from "next/link";
import { useState } from "react";

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
};

const CATEGORIES = ["Tous", "Web", "Mobile", "SaaS", "API", "E-commerce"];

const templates: Template[] = [
  {
    id: "landing",
    name: "Landing Page",
    description: "Page d'accueil moderne et responsive avec sections hero, fonctionnalités et CTA.",
    category: "Web",
    tags: ["Next.js", "Tailwind"],
  },
  {
    id: "ecommerce",
    name: "E‑commerce Starter",
    description: "Interface e-commerce complète avec pages produits, panier et checkout.",
    category: "E-commerce",
    tags: ["React", "Stripe"],
  },
  {
    id: "dashboard",
    name: "Admin Dashboard",
    description: "Dashboard d'administration complet avec graphiques, tables et gestion utilisateurs.",
    category: "SaaS",
    tags: ["Next.js", "Charts"],
  },
  {
    id: "saas-starter",
    name: "SaaS Starter Kit",
    description: "Kit de démarrage SaaS avec authentification, billing et gestion des abonnements.",
    category: "SaaS",
    tags: ["Next.js", "Clerk", "PawaPay"],
  },
  {
    id: "rest-api",
    name: "REST API",
    description: "API REST complète avec authentification JWT, validation et documentation.",
    category: "API",
    tags: ["Node.js", "Express"],
  },
  {
    id: "blog",
    name: "Blog Platform",
    description: "Plateforme de blog avec éditeur Markdown, catégories et système de commentaires.",
    category: "Web",
    tags: ["Next.js", "MDX"],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Portfolio développeur avec projets, expériences et formulaire de contact.",
    category: "Web",
    tags: ["React", "Framer Motion"],
  },
  {
    id: "mobile-app",
    name: "App Mobile",
    description: "Application mobile cross-platform avec navigation, auth et stockage local.",
    category: "Mobile",
    tags: ["React Native", "Expo"],
  },
  {
    id: "crm",
    name: "CRM",
    description: "Système de gestion de la relation client avec pipeline, contacts et rapports.",
    category: "SaaS",
    tags: ["Next.js", "Supabase"],
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Place de marché multi-vendeurs avec système de paiement et avis.",
    category: "E-commerce",
    tags: ["Next.js", "PawaPay"],
  },
  {
    id: "graphql-api",
    name: "GraphQL API",
    description: "API GraphQL avec schéma typé, resolvers et authentification.",
    category: "API",
    tags: ["Node.js", "Apollo"],
  },
  {
    id: "chat-app",
    name: "Application Chat",
    description: "Application de chat en temps réel avec WebSocket, groupes et partage de fichiers.",
    category: "Web",
    tags: ["Next.js", "WebSocket"],
  },
];

export default function TemplatesMarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = templates.filter((t) => {
    const matchCategory = activeCategory === "Tous" || t.category === activeCategory;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Marketplace de Templates</h1>
      <p className="text-gray-400 mb-8">
        Démarrez votre projet avec un template prêt à l&apos;emploi.
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((t) => (
          <div key={t.id} className="premium-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">{t.name}</div>
              <span className="text-xs text-gray-500 bg-surface px-2 py-1 rounded">{t.category}</span>
            </div>
            <div className="text-gray-400 text-sm flex-1">{t.description}</div>
            <div className="flex gap-2 flex-wrap">
              {t.tags.map((tag) => (
                <span key={tag} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href={`/projects/new?template=${t.id}`}
              className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit text-sm"
            >
              Utiliser ce template
            </Link>
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
