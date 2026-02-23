"use client";

export interface ArchitectureDefinition {
  id: string;
  name: string;
  description: string;
  tags: string[];
  complexity: "small" | "medium" | "large" | "xl";
  aiPrompt: string; // utilisé par projectArchitect + AI actions
}

export const ARCHITECTURES: ArchitectureDefinition[] = [
  // — Web : Frameworks frontend —
  {
    id: "nextjs",
    name: "Next.js App Router",
    description: "Framework React full-stack avec routing, API routes, server components et SSR.",
    tags: ["React", "SSR", "API", "Full-stack"],
    complexity: "large",
    aiPrompt: "Génère un projet Next.js 14 App Router complet avec pages, composants, API routes et layout.",
  },
  {
    id: "react",
    name: "React SPA",
    description: "Application monopage avec composants, hooks et routing côté client.",
    tags: ["React", "SPA"],
    complexity: "medium",
    aiPrompt: "Génère une SPA React propre avec composants, hooks, routing et gestion d'état.",
  },
  {
    id: "vue",
    name: "Vue.js 3",
    description: "Application Vue 3 avec Composition API, composants et routing.",
    tags: ["Vue", "SPA", "Composition API"],
    complexity: "medium",
    aiPrompt: "Génère un projet Vue 3 avec Composition API, composants, routing et store Pinia.",
  },
  {
    id: "svelte",
    name: "Svelte / SvelteKit",
    description: "Application Svelte moderne avec composants réactifs et performance optimale.",
    tags: ["Svelte", "SPA", "Performance"],
    complexity: "medium",
    aiPrompt: "Génère un projet Svelte avec composants, stores et routing.",
  },
  {
    id: "astro",
    name: "Astro",
    description: "Site statique ultra-rapide avec support multi-framework (React, Vue, Svelte).",
    tags: ["Astro", "SSG", "Multi-framework"],
    complexity: "medium",
    aiPrompt: "Génère un site Astro avec pages, composants et intégration de contenu.",
  },
  // — Mobile —
  {
    id: "react-native",
    name: "React Native / Expo",
    description: "Application mobile cross-platform avec React Native et Expo.",
    tags: ["Mobile", "React Native", "Expo", "Cross-platform"],
    complexity: "large",
    aiPrompt: "Génère une application React Native / Expo avec navigation, composants et gestion d'état.",
  },
  {
    id: "swiftui",
    name: "SwiftUI (iOS)",
    description: "Application iOS native avec SwiftUI, vues et navigation.",
    tags: ["Mobile", "iOS", "Swift"],
    complexity: "medium",
    aiPrompt: "Génère une application SwiftUI avec vues, navigation et modèles de données.",
  },
  {
    id: "kotlin",
    name: "Kotlin (Android)",
    description: "Application Android native avec Kotlin et Jetpack Compose.",
    tags: ["Mobile", "Android", "Kotlin"],
    complexity: "medium",
    aiPrompt: "Génère une application Android Kotlin avec Jetpack Compose, activités et modèles.",
  },
  // — Desktop —
  {
    id: "electron",
    name: "Electron",
    description: "Application desktop cross-platform avec Electron et technologies web.",
    tags: ["Desktop", "Electron", "Cross-platform"],
    complexity: "medium",
    aiPrompt: "Génère une application Electron avec fenêtre principale, menu et structure de projet.",
  },
  {
    id: "tauri",
    name: "Tauri",
    description: "Application desktop légère et sécurisée avec Tauri et Rust.",
    tags: ["Desktop", "Tauri", "Rust", "Performance"],
    complexity: "large",
    aiPrompt: "Génère une application Tauri avec frontend web, commandes Rust et configuration.",
  },
  // — Backend —
  {
    id: "node",
    name: "Node.js Backend",
    description: "Backend léger avec Node.js, utilitaires et routing personnalisé.",
    tags: ["Backend", "Node"],
    complexity: "medium",
    aiPrompt: "Génère un backend Node.js avec routing, contrôleurs, utilitaires et configuration.",
  },
  {
    id: "express",
    name: "Express REST API",
    description: "Serveur API REST avec routing, contrôleurs, middleware et validation.",
    tags: ["API", "REST", "Backend"],
    complexity: "medium",
    aiPrompt: "Génère une API REST Express avec contrôleurs, routes, middleware et gestion d'erreurs.",
  },
  {
    id: "api-rest",
    name: "API REST Boilerplate",
    description: "Architecture API REST propre avec contrôleurs, services, repositories et validation.",
    tags: ["API", "REST", "Clean Architecture"],
    complexity: "large",
    aiPrompt: "Génère une architecture API REST propre avec contrôleurs, services, repositories, DTOs et validation.",
  },
  {
    id: "fastapi",
    name: "Python FastAPI",
    description: "API Python rapide et moderne avec FastAPI, Pydantic et documentation automatique.",
    tags: ["Python", "API", "FastAPI", "Backend"],
    complexity: "medium",
    aiPrompt: "Génère une API FastAPI avec routes, modèles Pydantic, dépendances et documentation.",
  },
  {
    id: "go",
    name: "Go API",
    description: "API Go performante avec net/http, routing et structure de projet propre.",
    tags: ["Go", "API", "Backend", "Performance"],
    complexity: "medium",
    aiPrompt: "Génère une API Go avec handlers, routing, middleware et structure de projet.",
  },
  // — Applications complètes —
  {
    id: "saas",
    name: "SaaS Boilerplate",
    description: "Fondation SaaS basique avec tableau de bord, authentification et API simple.",
    tags: ["SaaS", "Full-stack"],
    complexity: "large",
    aiPrompt: "Génère un boilerplate SaaS avec tableau de bord, composants, authentification et structure API.",
  },
  {
    id: "saas-advanced",
    name: "SaaS Avancé (Auth, Billing, DB)",
    description: "Stack SaaS complète avec authentification, facturation, base de données et tableau de bord.",
    tags: ["SaaS", "Auth", "Billing", "DB", "Full-stack"],
    complexity: "xl",
    aiPrompt: "Génère une plateforme SaaS complète avec auth, facturation, schéma BDD, tableau de bord, API routes et panneau admin.",
  },
  {
    id: "dashboard",
    name: "Tableau de bord",
    description: "Tableau de bord avec statistiques, graphiques et composants de données.",
    tags: ["Dashboard", "Analytics", "Full-stack"],
    complexity: "large",
    aiPrompt: "Génère un tableau de bord avec cartes statistiques, graphiques, tableau de données et navigation.",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Boutique en ligne avec catalogue produits, panier et API de commandes.",
    tags: ["E-commerce", "Boutique", "Full-stack"],
    complexity: "xl",
    aiPrompt: "Génère une boutique en ligne avec catalogue produits, panier, pages produit et API de commandes.",
  },
  {
    id: "game",
    name: "Jeu simple",
    description: "Jeu simple avec canvas HTML5, contrôles et boucle de jeu.",
    tags: ["Jeu", "Canvas", "JavaScript"],
    complexity: "medium",
    aiPrompt: "Génère un jeu simple avec canvas HTML5, contrôles clavier et boucle de rendu.",
  },
  {
    id: "template",
    name: "Template HTML/CSS/JS",
    description: "Template de base avec HTML, CSS et JavaScript. Point de départ universel.",
    tags: ["Template", "HTML", "CSS", "JavaScript"],
    complexity: "small",
    aiPrompt: "Génère un template de base avec HTML5, CSS moderne et JavaScript.",
  },
];
