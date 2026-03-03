# Prestige Build

> Plateforme SaaS de génération de code propulsée par l'IA — collaborative, multi-provider, et prête pour la production.

![CI](https://github.com/ngolaglodi-byte/prestige-build/actions/workflows/ci.yml/badge.svg)

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
- **Marketplace communautaire** — Publiez, clonez et remixez des projets avec recherche, tags et favoris
- **Facturation** — Système de crédits et abonnements
- **Stripe Kit** — Générez des intégrations Stripe (checkout, webhooks, plans, abonnements) dans vos applications
- **API Keys** — Gestion et suivi d'utilisation des clés API
- **Webhooks** — Système d'événements avec retry automatique
- **Admin** — Panneau d'administration complet

## 🏗️ Architecture

```
prestige-build/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Routes protégées du tableau de bord
│   ├── (site)/                # Pages publiques du site
│   ├── api/                   # 80+ endpoints API REST
│   │   ├── ai/               # Génération IA, Agent, Conversation
│   │   ├── projects/         # CRUD projets
│   │   ├── teams/            # Gestion d'équipes
│   │   ├── billing/          # Facturation
│   │   ├── deploy/           # Déploiement & environnements
│   │   ├── github/           # Import & sync GitHub
│   │   ├── marketplace/      # Marketplace communautaire
│   │   ├── stripe-kit/       # Générateur Stripe
│   │   ├── health/           # Health check
│   │   ├── docs/             # Documentation OpenAPI
│   │   └── cron/             # Tâches planifiées
│   ├── admin/                # Panneau admin
│   └── auth/                 # Authentification
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
│   ├── store/               # State management (Zustand)
│   ├── api-response.ts       # Format API standardisé
│   ├── rate-limit.ts         # Rate limiting
│   └── logger.ts             # Logging structuré (Pino)
├── db/                        # Base de données
│   ├── schema.ts             # Schéma Drizzle ORM (30+ tables)
│   ├── supabase-schema.ts    # Tables Supabase (read-only)
│   ├── client.ts             # Client DB
│   └── migrations/           # Migrations
├── components/               # Composants React
├── tests/                    # Tests
│   ├── unit/                 # 70 fichiers de tests unitaires (Vitest)
│   └── e2e/                  # Tests E2E (Playwright)
└── .github/workflows/        # CI/CD (GitHub Actions)
```

## 🛠️ Stack technique

| Couche | Technologie |
|--------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes, Node.js |
| **Base de données** | PostgreSQL + Drizzle ORM + Supabase |
| **Authentification** | Clerk |
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
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk | ✅ |
| `CLERK_SECRET_KEY` | Clé secrète Clerk | ✅ |
| `CLERK_WEBHOOK_SECRET` | Secret webhook Clerk | ✅ |
| `OPENAI_API_KEY` | Clé API OpenAI | ⚡ |
| `ANTHROPIC_API_KEY` | Clé API Anthropic | ⚡ |
| `GOOGLE_GENERATIVE_AI_KEY` | Clé API Google AI | ⚡ |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry | ❌ |
| `CRON_SECRET` | Secret pour les tâches CRON | ❌ |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (pour Stripe Kit) | ❌ |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | ❌ |
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

- **Authentification** — Clerk avec protection des routes dashboard
- **Rate limiting** — 60 requêtes/min par IP sur les routes API
- **Validation** — Zod sur toutes les entrées API
- **Headers de sécurité** — CSP, HSTS, X-Frame-Options, etc.
- **CORS** — Configuration restrictive
- **Webhooks** — Vérification de signature

## 🤖 CI/CD

Le pipeline GitHub Actions exécute automatiquement :

1. **Lint** — ESLint
2. **Build** — Next.js build
3. **Tests unitaires** — Vitest
4. **Tests E2E** — Playwright (Chrome, Firefox, Safari)

## 📄 Licence

MIT — © 2025 Prestige technologie company. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
