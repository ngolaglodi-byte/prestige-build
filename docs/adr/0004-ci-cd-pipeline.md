# ADR-0004 : Pipeline CI/CD avec GitHub Actions

## Statut

Accepté

## Contexte

Le projet a besoin d'un pipeline automatisé pour valider les changements et déployer l'application de manière fiable.

## Décision

Utiliser **GitHub Actions** pour l'intégration continue (CI) et le déploiement continu (CD) avec un workflow staging → production.

## Pipeline CI (`.github/workflows/ci.yml`)

Déclenché sur chaque push et PR vers `main` :

1. **Lint** — ESLint
2. **Security Audit** — `npm audit --audit-level=high`
3. **Build** — Next.js build
4. **Unit Tests** — Vitest avec rapport de couverture
5. **E2E Tests** — Playwright (après build)

## Pipeline CD (`.github/workflows/cd.yml`)

Déclenché sur push vers `main` et tags `v*` :

1. **Deploy Staging** — Vercel preview, déclenché sur chaque push vers `main`
2. **Smoke Test** — Health check HTTP sur le staging déployé
3. **Deploy Production** — Vercel production, déclenché uniquement sur tags `v*`

## Raisons

- **GitHub Actions** — Intégré nativement à GitHub, pas de service externe
- **Staging obligatoire** — Chaque changement passe par le staging avant la production
- **Tags pour la production** — Déploiement production explicite et traçable
- **Smoke test** — Validation automatique que le staging est fonctionnel

## Conséquences

- Les secrets (Clerk, Vercel, DB) doivent être configurés dans GitHub
- Les environnements GitHub (`staging`, `production`) doivent être créés
- La production requiert un tag de version (ex: `v0.1.0`)
