# Guide de déploiement

Ce document décrit comment déployer Prestige Build en staging et en production.

## Architecture de déploiement

```
GitHub (main) ──push──▶ CI (lint, audit, build, tests)
                              │
                              ▼
                    CD: Deploy Staging (Vercel preview)
                              │
                              ▼
                    Smoke Test Staging (health check)
                              │
                    ┌─── tag v* ? ───┐
                    │ non            │ oui
                    ▼                ▼
                  (fin)      Deploy Production (Vercel prod)
```

## Prérequis

### Secrets GitHub

Configurer les secrets suivants dans **Settings > Secrets and variables > Actions** :

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk |
| `CLERK_SECRET_KEY` | Clé secrète Clerk |
| `VERCEL_TOKEN` | Token d'API Vercel |
| `VERCEL_ORG_ID` | ID de l'organisation Vercel |
| `VERCEL_PROJECT_ID` | ID du projet Vercel |
| `STAGING_DATABASE_URL` | URL PostgreSQL pour le staging |
| `PRODUCTION_DATABASE_URL` | URL PostgreSQL pour la production |

### Variables GitHub

Configurer dans **Settings > Secrets and variables > Actions > Variables** :

| Variable | Description |
|----------|-------------|
| `STAGING_URL` | URL publique du staging (ex: `https://staging.prestige-build.vercel.app`) |

### Environnements GitHub

Créer deux environnements dans **Settings > Environments** :

- **staging** — déploiement automatique sur push vers `main`
- **production** — déploiement sur tag `v*`, avec approbation manuelle recommandée

## Déploiement Staging

Le staging se déploie **automatiquement** à chaque push sur `main` via le workflow CD :

1. Build Next.js avec les variables de staging
2. Déploiement vers Vercel (preview)
3. Smoke test (health check sur `/api/health`)

## Déploiement Production

La production se déploie uniquement sur **tag de version** :

```bash
# Créer un tag de release
git tag v0.1.0
git push origin v0.1.0
```

Le workflow CD :

1. Attend que le smoke test staging soit vert
2. Build Next.js avec les variables de production
3. Déploiement vers Vercel (production)

## Déploiement Docker

### Développement local

```bash
# Lancer l'application et la base de données
docker compose up --build
```

L'application est accessible sur `http://localhost:3000`.

### Production avec Docker

```bash
# Build de l'image
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=https://... \
  -t prestige-build:latest .

# Lancer le conteneur
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e CLERK_SECRET_KEY=sk_live_... \
  -e OPENAI_API_KEY=sk-... \
  prestige-build:latest
```

## Migrations de base de données

Les migrations Drizzle doivent être exécutées avant le déploiement :

```bash
# Générer les migrations
npm run db:generate

# Appliquer les migrations
npm run db:migrate
```

## Rollback

En cas de problème en production :

1. **Vercel** : utiliser le tableau de bord Vercel pour revenir au déploiement précédent (instant rollback)
2. **Base de données** : appliquer les migrations de rollback manuellement

## Health Check

L'endpoint `/api/health` retourne un status 200 quand l'application est opérationnelle. Il est utilisé par le smoke test du CD pipeline.

## Monitoring

- **Sentry** — Monitoring des erreurs et performances (configurer `NEXT_PUBLIC_SENTRY_DSN`)
- **Vercel Analytics** — Métriques web intégrées
- **Pino Logger** — Logs structurés JSON pour l'observabilité
