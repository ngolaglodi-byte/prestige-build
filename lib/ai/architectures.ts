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
  {
    id: "nextjs",
    name: "Next.js App Router",
    description: "Full-stack React framework with routing, API routes, server components, and SSR.",
    tags: ["React", "SSR", "API", "Full-stack"],
    complexity: "large",
    aiPrompt: "Generate a full Next.js 14 App Router project with pages, components, API routes, and layout structure.",
  },
  {
    id: "react",
    name: "React SPA",
    description: "Single-page application with components, hooks, and client-side routing.",
    tags: ["React", "SPA"],
    complexity: "medium",
    aiPrompt: "Generate a clean React SPA with components, hooks, routing, and state management.",
  },
  {
    id: "node",
    name: "Node.js Backend",
    description: "Lightweight backend using Node.js, filesystem, utilities, and custom routing.",
    tags: ["Backend", "Node"],
    complexity: "medium",
    aiPrompt: "Generate a Node.js backend with routing, controllers, utilities, and environment configuration.",
  },
  {
    id: "express",
    name: "Express REST API",
    description: "REST API server with routing, controllers, middleware, and validation.",
    tags: ["API", "REST", "Backend"],
    complexity: "medium",
    aiPrompt: "Generate an Express REST API with controllers, routes, middleware, and error handling.",
  },
  {
    id: "api-rest",
    name: "API REST Boilerplate",
    description: "Clean REST API architecture with controllers, services, repositories, and validation.",
    tags: ["API", "REST", "Clean Architecture"],
    complexity: "large",
    aiPrompt: "Generate a clean REST API architecture with controllers, services, repositories, DTOs, and validation.",
  },
  {
    id: "saas",
    name: "SaaS Boilerplate",
    description: "Basic SaaS foundation with dashboard, auth placeholders, and simple API.",
    tags: ["SaaS", "Full-stack"],
    complexity: "large",
    aiPrompt: "Generate a SaaS boilerplate with dashboard, components, auth placeholders, and API structure.",
  },
  {
    id: "saas-advanced",
    name: "SaaS Advanced (Auth, Billing, DB)",
    description: "Full SaaS stack with authentication, billing endpoints, database layer, and dashboard.",
    tags: ["SaaS", "Auth", "Billing", "DB", "Full-stack"],
    complexity: "xl",
    aiPrompt: "Generate a complete SaaS platform with auth, billing, database schema, dashboard, API routes, and admin panel.",
  },
];
