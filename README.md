# Prestige Build

> **Outil interne de génération de code propulsé par l'IA** — Plateforme collaborative de Prestige Technologie Company.

![CI](https://github.com/ngolaglodi-byte/prestige-build/actions/workflows/ci.yml/badge.svg)

⚠️ **Outil interne entreprise** — Authentification locale uniquement, pas d'inscription publique.

## ✨ Fonctionnalités

- **Génération de code IA** — Multi-provider (OpenAI GPT-4, Anthropic Claude, Google Gemini) avec fallback automatique
- **Agent IA multi-étapes** — Décompose les requêtes complexes en plans d'exécution séquentiels (analyse → plan → génération → déploiement)
- **Flux conversationnel Chat → App** — Décrivez une application en langage naturel, l'IA génère progressivement DB, Auth, UI, API, routing
- **Éditeur de code** — Monaco Editor intégré avec prévisualisation en temps réel (Sandpack)
- **Éditeur visuel drag-and-drop** — Synchronisation bidirectionnelle entre éditeur visuel et code source
- **Import Figma → Code** — Importez un design Figma et convertissez-le automatiquement en composants React/Tailwind avec mapping vers les pages Next.js
- **Gestion de projets** — Création, build, déploiement et gestion de fichiers
- **Déploiement multi-environnements** — Environnements dev, preview et production avec URLs automatiques
- **Sync GitHub bidirectionnelle** — Importez et exportez des projets vers/depuis GitHub avec détection de conflits
- **Équipes** — Collaboration multi-utilisateurs avec gestion des rôles
- **Templates** — Bibliothèque de templates réutilisables
- **API Keys** — Gestion et suivi d'utilisation des clés API
- **Webhooks** — Système d'événements avec retry automatique
- **Admin** — Panneau d'administration complet

## 🔐 Authentification

Prestige Build utilise un système d'authentification **local** (email + mot de passe) avec RBAC strict :

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | Administrateur système | Création/gestion des agents, accès à tous les projets, journaux d'audit |
| **AGENT** | Utilisateur interne | Accès au dashboard, création de projets, utilisation de l'IA |

### Caractéristiques de sécurité

- ✅ Hachage des mots de passe avec bcrypt (12 rounds)
- ✅ Sessions JWT avec cookies httpOnly, secure, sameSite
- ✅ Protection brute-force (verrouillage après 5 échecs)
- ✅ Politique de mot de passe stricte (12+ caractères, complexité)
- ✅ Journaux d'audit complets
- ✅ Pas d'inscription publique — comptes créés par l'admin uniquement

### Parcours utilisateur

1. **Configuration initiale** : `/setup` — Création du premier compte ADMIN
2. **Connexion** : `/login` — Authentification email + mot de passe
3. **Dashboard** : `/dashboard` — Accès aux projets et outils
4. **Admin** : `/admin` — Gestion des utilisateurs (ADMIN uniquement)

## 🏗️ Architecture

> Conçue et maintenue par **Prestige Technologie Company**, fondée par **Glody Dimputu Ngola**.

```
prestige-build/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Routes protégées du tableau de bord
│   ├── (site)/                # Pages publiques du site
│   ├── api/                   # 70+ endpoints API REST
│   │   ├── ai/               # Génération IA, Agent, Conversation
│   │   ├── auth/             # Authentification locale
│   │   ├── projects/         # CRUD projets
│   │   ├── teams/            # Gestion d'équipes
│   │   ├── deploy/           # Déploiement & environnements
│   │   ├── github/           # Import & sync GitHub
│   │   ├── health/           # Health check
│   │   ├── docs/             # Documentation OpenAPI
│   │   └── cron/             # Tâches planifiées
│   ├── admin/                # Panneau admin
│   ├── login/                # Page de connexion
│   └── setup/                # Configuration initiale
├── lib/                       # Logique métier partagée
│   ├── ai/                   # Orchestration IA (23 modules)
│   │   ├── agent.ts          # Agent multi-étapes
│   │   ├── conversational-flow.ts  # Chat → App pipeline
│   │   └── orchestrator.ts   # Orchestrateur principal
│   ├── billing/              # Logique de facturation
│   │   ├── plans.ts          # Définition des plans
│   │   ├── pricing.ts        # Tarification dynamique
│   │   └── stripe-kit.ts     # Générateur de code Stripe
│   ├── build/                # Moteur de build multi-plateforme
│   ├── collab/               # Collaboration éditeur (Monaco)
│   ├── collaboration/        # Collaboration projet (CRDT, commentaires)
│   ├── deploy/               # Déploiement
│   │   ├── deployManager.ts  # Orchestrateur de déploiement
│   │   └── environments.ts   # Gestion dev/preview/prod
│   ├── editor/               # Éditeur visuel
│   │   ├── visual-sync.ts    # Sync bidirectionnelle visuel ↔ code
│   │   └── drag-drop-engine.ts  # Moteur drag-and-drop
│   ├── figma/                # Import Figma → Code
│   │   ├── page-mapper.ts    # Mapping frames → pages Next.js
│   │   └── figmaToCode.ts    # Conversion design → React
│   ├── github/               # Intégration GitHub
│   │   ├── exporter.ts       # Export vers GitHub
│   │   ├── importer.ts       # Import depuis GitHub
│   │   └── sync.ts           # Synchronisation bidirectionnelle
│   ├── marketplace/          # Marketplace communautaire
│   ├── store/                # State management unifié (Zustand)
│   ├── api-response.ts       # Format API standardisé
│   ├── rate-limit.ts         # Rate limiting
│   └── logger.ts             # Logging structuré (Pino)
├── db/                        # Base de données
│   ├── schema.ts             # Schéma Drizzle ORM (30+ tables)
│   ├── supabase-schema.ts    # Tables Supabase (read-only)
│   ├── client.ts             # Client DB
│   └── migrations/           # Migrations
├── components/               # Composants React
│   ├── collab/               # UI collaboration éditeur
│   └── collaboration/        # UI collaboration projet
├── tests/                    # Tests
│   ├── unit/                 # 70+ fichiers de tests unitaires (Vitest)
│   └── e2e/                  # Tests E2E (Playwright)
└── .github/workflows/        # CI/CD (GitHub Actions)
```

### Drizzle ORM + Supabase : pourquoi les deux coexistent

Prestige Build utilise **deux couches complémentaires** pour accéder à la base de données PostgreSQL hébergée sur Supabase :

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **ORM typé** | Drizzle ORM | Schéma, migrations, requêtes SQL typées (CRUD, joins, transactions) |
| **Service temps réel** | Supabase JS (`service_role`) | Listeners temps réel, opérations nécessitant le `service_role` |

- **Drizzle ORM** est l'ORM unique du projet. Il génère et applique les migrations, définit le schéma dans `db/schema.ts` et fournit un client typé pour toutes les opérations de lecture/écriture.
- **Supabase JS** n'est utilisé que pour les fonctionnalités qui nécessitent le token `service_role` et les écoutes temps réel. Il ne remplace jamais Drizzle pour les requêtes standard.
- **Prisma n'est pas utilisé** et ne doit jamais être réintroduit.

## 🛠️ Stack technique

| Couche | Technologie |
|--------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes, Node.js |
| **Base de données** | PostgreSQL + Drizzle ORM + Supabase |
| **Authentification** | Local (email + password, JWT, bcrypt) |
| **IA** | OpenAI, Anthropic Claude, Google Gemini |
| **State** | Zustand |
| **Tests** | Vitest (unit), Playwright (E2E — Chrome, Firefox, Safari) |
| **Logging** | Pino (structured logging) |
| **Monitoring** | Sentry |
| **CI/CD** | GitHub Actions |
| **Conteneurisation** | Docker + Docker Compose |

## 🚀 Installation

### Prérequis

- Node.js 20+
- npm 10+
- PostgreSQL 16+ (ou Docker)

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/ngolaglodi-byte/prestige-build.git
cd prestige-build

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés (Clerk, Supabase, IA providers...)

# 4. Lancer la base de données (optionnel avec Docker)
docker compose up db -d

# 5. Appliquer les migrations
npm run db:migrate

# 6. Lancer le serveur de développement
npm run dev
```

### Avec Docker

```bash
# Tout lancer d'un coup
docker compose up --build
```

## 📝 Variables d'environnement

| Variable | Description | Requis |
|----------|------------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | ✅ |
| `SESSION_SECRET` | Secret pour les sessions JWT (min 32 caractères) | ✅ |
| `OPENAI_API_KEY` | Clé API OpenAI | ⚡ |
| `ANTHROPIC_API_KEY` | Clé API Anthropic | ⚡ |
| `GOOGLE_GENERATIVE_AI_KEY` | Clé API Google AI | ⚡ |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry | ❌ |
| `CRON_SECRET` | Secret pour les tâches CRON | ❌ |
| `FIGMA_ACCESS_TOKEN` | Token d'accès Figma | ❌ |
| `GITHUB_TOKEN` | Token d'accès GitHub (pour sync) | ❌ |
| `VERCEL_TOKEN` | Token API Vercel (pour déploiement) | ❌ |
| `DISABLE_WEBPACK_CACHE` | Désactiver le cache Webpack (auto sur Windows) | ❌ |

⚡ Au moins un fournisseur IA est requis.

## 🧪 Tests

```bash
# Tests unitaires
npm run test:unit

# Tests unitaires en mode watch
npm run test:unit:watch

# Tests E2E (Chrome, Firefox, Safari)
npm run test:e2e

# Tests E2E avec interface visuelle
npm run test:ui
```

## 📚 Documentation API

L'API expose une spécification OpenAPI 3.0 :

- **Swagger UI** : [https://ngolaglodi-byte.github.io/prestige-build](https://ngolaglodi-byte.github.io/prestige-build)
- **Spec JSON** : `GET /api/docs`
- **Health check** : `GET /api/health`

### Format de réponse standardisé

Toutes les réponses API utilisent l'enveloppe :

```json
{
  "ok": true,
  "data": { ... }
}
```

En cas d'erreur :

```json
{
  "ok": false,
  "error": "Message d'erreur"
}
```

## 🔒 Sécurité

- **Authentification** — Locale avec JWT, sessions sécurisées, cookies httpOnly
- **RBAC** — Rôles ADMIN et AGENT avec contrôle d'accès strict
- **Protection brute-force** — Verrouillage de compte après 5 échecs
- **Mots de passe** — Hachage bcrypt (12 rounds), politique de complexité
- **Rate limiting** — 60 requêtes/min par IP sur les routes API
- **Validation** — Zod sur toutes les entrées API
- **Headers de sécurité** — CSP, HSTS, X-Frame-Options, etc.
- **CORS** — Configuration restrictive
- **Journaux d'audit** — Traçabilité complète des actions utilisateur

## 🗂️ Structure des stores

Tous les stores Zustand sont centralisés dans `lib/store/` et réexportés via `lib/store/index.ts`.

| Store | Fichier | Rôle |
|-------|---------|------|
| `useWorkspaceStore` | `lib/store/useWorkspaceStore.ts` | Fichiers du workspace en mémoire |
| `useNotificationStore` | `lib/store/useNotificationStore.ts` | Notifications utilisateur |
| `useAIStore` | `lib/store/useAIStore.ts` | Messages et suggestions IA (persisté) |
| `useAIPreviewStore` | `lib/store/useAIPreviewStore.ts` | Prévisualisation mono-fichier IA |
| `useAIMultiPreviewStore` | `lib/store/useAIMultiPreviewStore.ts` | Prévisualisation multi-fichier IA |
| `useFileTree` | `lib/store/fileTree.ts` | Arbre de fichiers du projet |
| `useEditor` | `lib/store/editor.ts` | Contenu de l'éditeur |
| `useTabs` | `lib/store/tabs.ts` | Onglets ouverts |
| `useAiPanel` | `lib/store/aiPanel.ts` | Panneau de chat IA |
| `useAiDiff` | `lib/store/aiDiffStore.ts` | Diffs IA |
| `useLogsStore` | `lib/store/logsStore.ts` | Logs (AI, build, erreurs, runtime) |

## 🤝 Structure de la collaboration

Le projet sépare **intentionnellement** deux systèmes de collaboration :

### `lib/collab/` + `components/collab/` — Collaboration éditeur

Collaboration temps réel **dans l'éditeur de code** (Monaco Editor) : curseurs ligne/colonne, sélections, synchronisation d'éditions via WebSocket.

| Module | Rôle |
|--------|------|
| `CollabServer.ts` | Gestion des rooms WebSocket par projet |
| `PresenceManager.ts` | Présence utilisateur au niveau fichier (TTL 30 s) |
| `CollaboratorAvatars.tsx` | Avatars empilés des collaborateurs |
| `RemoteCursors.tsx` | Overlay curseurs distants dans Monaco |

### `lib/collaboration/` + `components/collaboration/` — Collaboration projet

Collaboration étendue **au niveau du projet** : CRDT, commentaires contextuels, résolution de conflits, présence par page.

| Module | Rôle |
|--------|------|
| `realtime-engine.ts` | Rooms et curseurs x/y par page |
| `presence-manager.ts` | Présence par page avec TTL |
| `crdt-store.ts` | Store CRDT (LWW register) |
| `conflict-resolver.ts` | Résolution de conflits concurrents |
| `comment-system.ts` | Commentaires in-memory par composant |
| `PresenceBar.tsx` | Barre d'utilisateurs en ligne |
| `UserCursor.tsx` | Curseur SVG d'un collaborateur |
| `CommentThread.tsx` | Fil de commentaires |
| `ActivityFeed.tsx` | Flux d'activité |
| `ShareDialog.tsx` | Dialogue de partage |

> Les deux systèmes coexistent intentionnellement et ne doivent **pas** être fusionnés. Voir `lib/collab/README.md` et `lib/collaboration/README.md` pour plus de détails.

## 💻 Développement local

```bash
# 1. Cloner le dépôt
git clone https://github.com/ngolaglodi-byte/prestige-build.git
cd prestige-build

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés (Clerk, Supabase, IA providers...)

# 4. Lancer la base de données (Docker)
docker compose up db -d

# 5. Appliquer les migrations Drizzle
npm run db:generate
npm run db:migrate

# 6. Lancer le serveur de développement
npm run dev
# → http://localhost:3000

# 7. Lancer les tests
npm run test:unit          # Tests unitaires (Vitest)
npm run test:unit:watch    # Mode watch
npm run test:e2e           # Tests E2E (Playwright)
```

## 🤖 CI/CD

Le pipeline GitHub Actions exécute automatiquement :

1. **Lint** — ESLint
2. **Build** — Next.js build
3. **Tests unitaires** — Vitest (avec couverture)
4. **Tests E2E** — Playwright (Chrome, Firefox, Safari)

La documentation API Swagger est déployée automatiquement sur GitHub Pages via le workflow `docs.yml`.

## 👥 Contributeurs

**Prestige Build** est un produit conçu et développé par **Prestige Technologie Company**.

| Rôle | Contributeur |
|------|-------------|
| Architecte principal & Fondateur | **Glody Dimputu Ngola** |
| Société éditrice | **Prestige Technologie Company** |

L'architecture du système — incluant la stratégie de stores, le double système de collaboration, l'intégration Drizzle/Supabase et le pipeline CI/CD — a été conçue par Glody Dimputu Ngola.

## 📄 Licence

MIT — © 2025 Prestige Technologie Company. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
