# ADR-0001 : Next.js App Router

## Statut

Accepté

## Contexte

Le projet a besoin d'un framework fullstack pour servir le frontend React et les API REST. Les options principales sont Next.js (Pages Router ou App Router), Remix, et une architecture séparée frontend/backend.

## Décision

Utiliser **Next.js 14 avec App Router** comme framework principal.

## Raisons

- **Colocation** — Pages et API routes dans le même projet, simplifiant le déploiement
- **Server Components** — Rendu côté serveur par défaut, performances optimales
- **Écosystème** — Large communauté, documentation exhaustive, intégrations (Vercel, Clerk, Sentry)
- **App Router** — Architecture moderne basée sur les layouts imbriqués et le streaming

## Conséquences

- Les API routes sont dans `app/api/`
- Le routing est basé sur le système de fichiers
- Le déploiement cible Vercel en priorité
