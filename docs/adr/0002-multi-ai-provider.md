# ADR-0002 : Architecture multi-provider IA

## Statut

Accepté

## Contexte

L'application génère du code via des modèles de langage. S'appuyer sur un seul fournisseur crée un point de défaillance unique et empêche de choisir le meilleur modèle selon le cas d'usage.

## Décision

Implémenter une **architecture multi-provider** supportant OpenAI, Anthropic Claude, et Google Gemini, avec un mécanisme de fallback automatique.

## Raisons

- **Résilience** — Si un provider est indisponible, l'application bascule automatiquement sur un autre
- **Flexibilité** — Chaque provider a des forces différentes (qualité, vitesse, coût)
- **Évolutivité** — Ajouter un nouveau provider nécessite uniquement un adaptateur

## Conséquences

- Le module `lib/ai/provider.ts` gère la sélection et le fallback
- L'orchestrateur `lib/ai/orchestrator.ts` coordonne les requêtes
- Au moins un provider IA doit être configuré via les variables d'environnement
