export type PlanId = "free" | "pro" | "enterprise";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceUsd: number;
  credits: number;
  limits: {
    aiGenerations: number;
    workspaceSizeMb: number;
    maxProjects: number;
  };
  features: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Gratuit",
    priceUsd: 0,
    credits: 10,
    limits: {
      aiGenerations: 10,
      workspaceSizeMb: 100,
      maxProjects: 1,
    },
    features: [
      "1 projet",
      "10 générations IA / mois",
      "100 Mo d'espace de travail",
      "Templates communautaires",
      "Aperçu limité",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceUsd: 20,
    credits: 500,
    limits: {
      aiGenerations: 500,
      workspaceSizeMb: 2000,
      maxProjects: 20,
    },
    features: [
      "20 projets",
      "500 générations IA / mois",
      "2 Go d'espace de travail",
      "Génération IA avancée",
      "Export vers GitHub",
      "Déploiement Vercel",
      "Aperçu complet",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceUsd: 70,
    credits: 2000,
    limits: {
      aiGenerations: 2000,
      workspaceSizeMb: 10000,
      maxProjects: -1, // illimité
    },
    features: [
      "Projets illimités",
      "2000 générations IA / mois",
      "10 Go d'espace de travail",
      "Modèles IA personnalisés",
      "Collaboration d'équipe",
      "Cloud privé",
      "Support dédié",
      "SLA & onboarding",
    ],
  },
};

export function getPlan(planId: string): PlanDefinition {
  return PLANS[planId as PlanId] ?? PLANS.free;
}
