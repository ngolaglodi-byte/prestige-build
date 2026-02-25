# ADR-0003 : Rate limiting avec Redis (Upstash)

## Statut

Accepté

## Contexte

L'API doit être protégée contre les abus. Un rate limiter en mémoire fonctionne en développement mais ne partage pas l'état entre les instances en production (serverless ou multi-pod).

## Décision

Migrer le rate limiter vers **Redis via Upstash**, avec un fallback automatique vers le rate limiter en mémoire si Redis n'est pas configuré.

## Raisons

- **État partagé** — Redis permet de synchroniser les compteurs entre toutes les instances serverless
- **Upstash** — Service Redis serverless compatible avec Vercel (REST API, pas de connexion persistante)
- **Fallback gracieux** — En cas d'erreur Redis ou d'absence de configuration, le rate limiter en mémoire prend le relais
- **Simplicité** — Implémentation basée sur `INCR` + `EXPIRE`, sans dépendance complexe

## Implémentation

- `lib/redis.ts` — Client Redis singleton (Upstash)
- `lib/rate-limit.ts` — Rate limiter dual-mode (Redis async / in-memory sync)
- `middleware.ts` — Application du rate limiting sur les routes `/api/*`

## Conséquences

- Variables `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` optionnelles
- En développement, le rate limiter en mémoire est utilisé par défaut
- Les tests unitaires couvrent les deux modes (mocks Redis)
