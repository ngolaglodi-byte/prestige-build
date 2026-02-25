# Prestige Build

> Plateforme SaaS de génération de code propulsée par l'IA — collaborative, multi-provider, et prête pour la production.

![CI](https://github.com/ngolaglodi-byte/prestige-build/actions/workflows/ci.yml/badge.svg)

## ✨ Fonctionnalités

- **Génération de code IA** — Multi-provider (OpenAI GPT-4, Anthropic Claude, Google Gemini) avec fallback automatique
- **Éditeur de code** — Monaco Editor intégré avec prévisualisation en temps réel (Sandpack)
- **Gestion de projets** — Création, build, déploiement et gestion de fichiers
- **Équipes** — Collaboration multi-utilisateurs avec gestion des rôles
- **Templates** — Bibliothèque de templates réutilisables
- **Facturation** — Système de crédits et abonnements
- **API Keys** — Gestion et suivi d'utilisation des clés API
- **Webhooks** — Système d'événements avec retry automatique
- **Admin** — Panneau d'administration complet

## 🏗️ Architecture

```
prestige-build/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Routes protégées du tableau de bord
│   ├── (site)/                # Pages publiques du site
│   ├── api/                   # 70+ endpoints API REST
│   │   ├── ai/               # Génération IA
│   │   ├── projects/         # CRUD projets
│   │   ├── teams/            # Gestion d'équipes
│   │   ├── billing/          # Facturation
│   │   ├── health/           # Health check
│   │   ├── docs/             # Documentation OpenAPI
│   │   └── cron/             # Tâches planifiées
│   ├── admin/                # Panneau admin
│   └── auth/                 # Authentification
├── lib/                       # Logique métier partagée
│   ├── ai/                   # Orchestration IA (21 modules)
│   ├── billing/              # Logique de facturation
│   ├── build/                # Moteur de build
│   ├── deploy/               # Déploiement
│   ├── api-response.ts       # Format API standardisé
│   ├── rate-limit.ts         # Rate limiting
│   └── logger.ts             # Logging structuré (Pino)
├── db/                        # Base de données
│   ├── schema.ts             # Schéma Drizzle ORM
│   ├── client.ts             # Client DB
│   └── migrations/           # Migrations
├── components/               # Composants React
├── store/                    # State management (Zustand)
├── tests/                    # Tests
│   ├── unit/                 # Tests unitaires (Vitest)
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

Propriétaire — © Prestige Build
