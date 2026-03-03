# Architecture

## Vue d'ensemble

Prestige Build est une plateforme SaaS Next.js 14 (App Router) avec une architecture modulaire centrée autour du dossier `lib/` pour la logique métier partagée.

## Structure des modules

```
lib/
├── ai/            # Orchestration IA multi-provider (23 modules)
├── billing/       # Plans, tarification, Stripe Kit
├── build/         # Moteur de build multi-plateforme
├── builder/       # Générateur de code et templates
├── collab/        # Collaboration temps réel (CRDT)
├── collaboration/ # Commentaires et gestion de conflits
├── credits/       # Système de crédits
├── deploy/        # Déploiement multi-environnements
├── editor/        # Éditeur visuel et synchronisation
├── figma/         # Import Figma → Code
├── github/        # Sync bidirectionnelle GitHub
├── marketplace/   # Marketplace communautaire
├── preview/       # Prévisualisation temps réel
├── store/         # State management (Zustand)
├── translations/  # Internationalisation
├── usage/         # Suivi d'utilisation
├── utils/         # Utilitaires partagés
└── fs/            # Système de fichiers virtuel
```

## State Management (`lib/store/`)

Tous les stores Zustand sont centralisés dans `lib/store/` :

| Store | Rôle |
|-------|------|
| `aiDiffStore.ts` | Visualisation des diffs IA |
| `aiMultiPreview.ts` | Prévisualisation multi-fichiers (avec ancien/nouveau contenu) |
| `aiPanel.ts` | Panneau de chat IA avec appels API |
| `editor.ts` | Chargement et sauvegarde de fichiers |
| `fileTree.ts` | Arborescence de fichiers du projet |
| `logsStore.ts` | Logs multi-catégories (IA, build, erreur, runtime) |
| `tabs.ts` | Gestion des onglets ouverts |
| `useAIMultiPreviewStore.ts` | Prévisualisation multi-fichiers (liste de previews) |
| `useAIPreviewStore.ts` | Prévisualisation single-file |
| `useAIStore.ts` | Messages et suggestions IA (persisté en localStorage) |
| `useNotificationStore.ts` | Notifications avec statut lu/non-lu |
| `useWorkspaceStore.ts` | Contenu des fichiers du workspace |

## Flux de données

```
Composants React → Zustand Stores (lib/store/) → API Routes (app/api/) → Base de données (Drizzle ORM)
```

## Décisions architecturales

Les ADR (Architecture Decision Records) sont documentés dans `docs/adr/`.
