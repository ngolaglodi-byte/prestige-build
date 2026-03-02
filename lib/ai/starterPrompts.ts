// lib/ai/starterPrompts.ts
// Pre-defined starter prompts for the prompt-to-app experience.

export interface StarterPrompt {
  icon: string;
  label: string;
  prompt: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    icon: "🛒",
    label: "E-commerce",
    prompt:
      "Crée une boutique en ligne avec panier, paiement et gestion de produits",
  },
  {
    icon: "📋",
    label: "Dashboard",
    prompt:
      "Crée un tableau de bord analytique avec graphiques et KPIs",
  },
  {
    icon: "💬",
    label: "Chat App",
    prompt:
      "Crée une application de messagerie en temps réel",
  },
  {
    icon: "📝",
    label: "Blog/CMS",
    prompt:
      "Crée un blog avec éditeur markdown, catégories et commentaires",
  },
];
