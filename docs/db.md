# Stratégie d'accès à la base de données — Prestige Build

> Architecture conçue par **Prestige Technologie Company**, fondée et dirigée par **Glody Dimputu Ngola**, architecte principal.

## Vue d'ensemble

Prestige Build utilise **deux clients** pour interagir avec la même base de données PostgreSQL hébergée sur **Supabase** :

| Client | Rôle | Fichier |
|--------|------|---------|
| **Drizzle ORM** | ORM typé pour les requêtes internes, migrations et logique métier | `db/client.ts` |
| **Supabase JS** (`@supabase/supabase-js`) | Accès `service_role` pour les webhooks et opérations nécessitant un bypass RLS | `lib/supabase.ts` |

## Pourquoi deux clients coexistent

### Drizzle ORM — Requêtes internes et migrations

- **Type safety** : Toutes les requêtes sont typées grâce au schéma TypeScript (`db/schema.ts`).
- **Migrations** : Drizzle Kit génère et applique les migrations de manière déclarative (`npm run db:generate`, `npm run db:migrate`).
- **Requêtes complexes** : Jointures, agrégations et sous-requêtes sont exprimées de manière lisible et maintenable.
- **Schéma unifié** : Toutes les tables, incluant `projects`, sont définies dans `db/schema.ts` et gérées par Drizzle.

Drizzle est l'ORM **unique** du projet. Prisma ne doit jamais être réintroduit.

### Supabase JS — Webhooks et bypass RLS

- **`service_role` key** : Permet de contourner les Row Level Security (RLS) policies de Supabase lorsque nécessaire (ex. : traitement de webhooks Clerk ou Stripe).
- **Webhooks** : Les endpoints webhook (`/api/clerk/webhook`, `/api/billing/webhook`) reçoivent des événements externes et doivent écrire dans des tables protégées par RLS sans contexte utilisateur authentifié.
- **Opérations administratives** : Certaines opérations admin nécessitent un accès élevé que le client Drizzle (utilisant la `DATABASE_URL` directe) ne fournit pas dans un contexte RLS.

## Règle fondamentale : ne pas mélanger les deux

| Contexte | Client à utiliser |
|----------|-------------------|
| Routes API standard (CRUD, logique métier) | **Drizzle ORM** (`db`) |
| Webhooks (Clerk, Stripe, événements externes) | **Supabase JS** (`supabase`, `service_role`) |
| Migrations et schéma | **Drizzle Kit** (`npm run db:generate`) |

**Ne jamais** utiliser Supabase JS dans les routes API standard. Cela contournerait les politiques de sécurité RLS et créerait une incohérence architecturale.

**Ne jamais** utiliser Drizzle pour les webhooks qui nécessitent un bypass RLS, car le pool PostgreSQL de Drizzle ne porte pas le rôle `service_role`.

## Structure des fichiers

```
db/
├── client.ts             # Client Drizzle (Pool PostgreSQL + schéma combiné)
├── schema.ts             # Toutes les tables gérées par Drizzle (migrations actives)
├── supabase-schema.ts    # Réservé pour tables Supabase (actuellement vide)
├── migrations/           # Migrations générées par Drizzle Kit
└── seed.ts               # Script de peuplement initial
```

## Schéma

- **`db/schema.ts`** — Toutes les tables : `users`, `projects`, `domains`, `files`, `teams`, `builds`, etc. Ces tables sont incluses dans les migrations Drizzle.
- **`db/supabase-schema.ts`** — Actuellement vide. Réservé pour de futures tables qui seraient gérées directement par Supabase.

## Intégration dans l'architecture

```
┌─────────────────────────────────────────────────┐
│                  API Routes                      │
│  /api/projects/*   /api/ai/*   /api/billing/*   │
│                                                  │
│  ┌──────────────────┐   ┌─────────────────────┐ │
│  │   Drizzle ORM    │   │   Supabase JS       │ │
│  │  (db/client.ts)  │   │ (service_role only) │ │
│  │                  │   │                     │ │
│  │  • CRUD          │   │  • Webhooks         │ │
│  │  • Requêtes      │   │  • Bypass RLS       │ │
│  │  • Migrations    │   │  • Events externes  │ │
│  └────────┬─────────┘   └────────┬────────────┘ │
│           │                      │               │
│           └──────────┬───────────┘               │
│                      │                           │
│              ┌───────▼────────┐                  │
│              │   PostgreSQL    │                  │
│              │   (Supabase)   │                  │
│              └────────────────┘                  │
└─────────────────────────────────────────────────┘
```

## Variables d'environnement

| Variable | Utilisée par | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Drizzle ORM | URL de connexion PostgreSQL directe |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase JS | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase JS | Clé `service_role` (bypass RLS) |

## Commandes utiles

```bash
# Générer une migration après modification de db/schema.ts
npm run db:generate

# Appliquer les migrations en base
npm run db:migrate

# Peupler la base de données
npm run db:seed
```

---

*Document maintenu par l'équipe Prestige Technologie Company.*

## Migration de la table `projects`

La table `projects` était précédemment définie dans `db/supabase-schema.ts` comme étant "gérée par Supabase". Cela causait des problèmes car :
1. Les migrations Drizzle n'incluaient pas la table `projects`
2. La table devait être créée manuellement dans Supabase
3. Des erreurs survenaient lors de l'ouverture du workspace si la table n'existait pas

**Solution appliquée** : La table `projects` a été déplacée vers `db/schema.ts` pour être gérée par Drizzle. Cela garantit que :
- La table est créée automatiquement lors de l'exécution de `npm run db:migrate`
- Les foreign keys vers `projects` fonctionnent correctement
- Le workspace s'ouvre sans erreur

### Règle sur `lib/db.ts`

> `lib/db.ts` est un **re-export** de `db/client.ts`. Il existe pour la compatibilité avec les anciens imports.
> `db/client.ts` est la **source unique** du client Drizzle. Toute initialisation ou configuration du pool doit se faire dans ce fichier.
