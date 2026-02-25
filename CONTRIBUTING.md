# Contributing to Prestige Build

Merci de contribuer à Prestige Build ! Ce guide explique comment participer au projet.

## Prérequis

- Node.js 20+
- npm 10+
- PostgreSQL 16+ (ou Docker)
- Git

## Mise en place locale

```bash
# 1. Forker et cloner le dépôt
git clone https://github.com/<votre-username>/prestige-build.git
cd prestige-build

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés

# 4. Lancer la base de données
docker compose up db -d

# 5. Appliquer les migrations
npm run db:migrate

# 6. Lancer le serveur de développement
npm run dev
```

## Workflow de contribution

1. Créer une branche depuis `main` :
   ```bash
   git checkout -b feat/ma-feature
   ```
2. Faire vos modifications.
3. Vérifier que le code compile et les tests passent :
   ```bash
   npm run lint
   npm run test:unit
   ```
4. Commiter avec un message descriptif :
   ```bash
   git commit -m "feat: ajouter la fonctionnalité X"
   ```
5. Pousser et ouvrir une Pull Request vers `main`.

## Conventions de commit

Ce projet utilise les [Conventional Commits](https://www.conventionalcommits.org/) :

| Préfixe    | Description                          |
|-----------|--------------------------------------|
| `feat:`   | Nouvelle fonctionnalité              |
| `fix:`    | Correction de bug                    |
| `docs:`   | Documentation uniquement             |
| `test:`   | Ajout ou modification de tests       |
| `refactor:` | Refactoring (pas de changement fonctionnel) |
| `ci:`     | Changements CI/CD                    |
| `chore:`  | Tâches de maintenance                |

## Tests

### Tests unitaires (Vitest)

```bash
# Lancer tous les tests unitaires
npm run test:unit

# Mode watch
npm run test:unit:watch

# Avec couverture
npm run test:unit -- --coverage
```

Les tests unitaires se trouvent dans `tests/unit/`. Chaque fichier de test correspond à un module dans `lib/`.

**Objectif de couverture : ≥ 80%** sur les lignes, fonctions, branches et statements.

### Tests E2E (Playwright)

```bash
# Installer les navigateurs
npx playwright install --with-deps

# Lancer les tests E2E
npm run test:e2e

# Mode interactif
npm run test:ui
```

Les tests E2E se trouvent dans `tests/e2e/`.

## Structure du projet

```
prestige-build/
├── app/                  # Next.js App Router (pages & API routes)
├── lib/                  # Logique métier partagée
├── components/           # Composants React
├── store/                # State management (Zustand)
├── db/                   # Schéma et migrations (Drizzle ORM)
├── tests/                # Tests unitaires et E2E
├── docs/                 # Documentation (ADRs, guide de déploiement)
└── .github/workflows/    # CI/CD (GitHub Actions)
```

## CI/CD

Chaque Pull Request déclenche automatiquement :

1. **Lint** — ESLint
2. **Security Audit** — `npm audit`
3. **Build** — Next.js build
4. **Tests unitaires** — Vitest avec couverture
5. **Tests E2E** — Playwright

La PR doit être verte avant d'être mergée.

## Style de code

- TypeScript strict
- ESLint avec la configuration Next.js
- Pas de `any` sauf cas exceptionnel documenté
- Imports avec alias `@/` (racine du projet)

## Signaler un bug

Ouvrir une [issue](https://github.com/ngolaglodi-byte/prestige-build/issues) avec :

- Description du bug
- Étapes pour reproduire
- Comportement attendu vs observé
- Environnement (OS, Node.js, navigateur)

## Proposer une fonctionnalité

Ouvrir une [issue](https://github.com/ngolaglodi-byte/prestige-build/issues) avec le label `enhancement` et décrire le besoin, le contexte et la solution envisagée.
