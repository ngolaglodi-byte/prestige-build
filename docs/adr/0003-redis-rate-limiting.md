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
- **Atomicité** — Un script Lua exécute `INCR` + `EXPIRE` en une seule opération atomique, éliminant les race conditions où une clé pourrait persister sans TTL

## Implémentation

- `lib/redis.ts` — Client Redis singleton (Upstash)
- `lib/rate-limit.ts` — Rate limiter dual-mode (Redis async / in-memory sync)
  - `rateLimitAsync()` — Utilise un script Lua atomique en Redis, fallback in-memory
  - `rateLimit()` — In-memory uniquement (synchrone)
  - `withRateLimit()` — Middleware réutilisable pour les routes API
- `middleware.ts` — Application du rate limiting sur les routes `/api/*`

### Clés Redis

| Clé | Format | TTL | Description |
|-----|--------|-----|-------------|
| Rate limit API | `rl:api:<ip>` | 60s | Limite globale par IP (60 req/min) |
| Rate limit route | `rl:<prefix>:<ip>` | configurable | Limite par route sensible (AI, preview, projects) |

### Script Lua (atomique)

```lua
local key = KEYS[1]
local window = tonumber(ARGV[1])
local current = redis.call('INCR', key)
if current == 1 then
  redis.call('EXPIRE', key, window)
end
return current
```

Ce script garantit que l'incrément et l'expiration sont appliqués dans la même transaction Redis, évitant toute race condition.

## Conséquences

- Variables `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` optionnelles
- En développement, le rate limiter en mémoire est utilisé par défaut
- Les tests unitaires couvrent les deux modes (mocks Redis)
- Le middleware `withRateLimit` peut être utilisé directement dans les route handlers pour des limites spécifiques
