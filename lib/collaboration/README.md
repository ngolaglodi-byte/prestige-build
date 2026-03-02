# lib/collaboration/ — Extended Collaboration Engine

> Prestige Build — Prestige Technologie Company, fondée par Glody Dimputu Ngola.

## Rôle

Ce dossier fournit le **moteur de collaboration étendu** au niveau du projet global.
Il couvre la synchronisation CRDT, les commentaires contextuels, la résolution de conflits et la présence utilisateur au niveau des pages et composants.

## Fichiers

| Fichier | Description |
|---------|-------------|
| `realtime-engine.ts` | Gestion des rooms et utilisateurs pour la collaboration projet (join/leave, curseurs x/y). |
| `presence-manager.ts` | Suivi de présence par room avec TTL 30 s : page consultée, position curseur, attribution de couleur. |
| `crdt-store.ts` | Store CRDT simplifié (LWW register) pour la fusion d'état sans conflit. |
| `conflict-resolver.ts` | Résolution de conflits (last-writer-wins) pour les éditions concurrentes sur un même fichier. |
| `comment-system.ts` | Système de commentaires in-memory pour les composants et pages d'un projet. |

## Consommateurs

- `app/api/collaboration/socket/route.ts` — Route API pour les rooms de collaboration.
- `app/api/collaboration/presence/route.ts` — Route API pour la présence utilisateur.
- `app/api/collaboration/comments/route.ts` — Route API pour les commentaires.
- `components/collaboration/PresenceBar.tsx` — Barre d'utilisateurs en ligne.
- `components/collaboration/UserCursor.tsx` — Curseur d'un utilisateur distant.
- `components/collaboration/CommentThread.tsx` — Fil de commentaires.
- `components/collaboration/ActivityFeed.tsx` — Flux d'activité en temps réel.
- `components/collaboration/ShareDialog.tsx` — Dialogue de partage de projet.

## Différence avec `lib/collab/`

| Aspect | `lib/collab/` | `lib/collaboration/` |
|--------|---------------|----------------------|
| Scope | Éditeur de code (Monaco) | Projet global (pages, composants) |
| Cursors | Ligne/colonne dans un fichier | Position x/y sur une page |
| Fonctionnalités | Rooms WS, éditions, curseurs, sélections | CRDT, commentaires, résolution de conflits, présence page |
| Composants UI | `CollaboratorAvatars`, `RemoteCursors` | `PresenceBar`, `UserCursor`, `CommentThread`, `ActivityFeed`, `ShareDialog` |

Les deux dossiers coexistent intentionnellement et ne doivent **pas** être fusionnés.
