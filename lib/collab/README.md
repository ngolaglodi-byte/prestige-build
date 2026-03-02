# lib/collab/ — Code-Editor Real-Time Collaboration

> Prestige Build — Prestige Technologie Company, fondée par Glody Dimputu Ngola.

## Rôle

Ce dossier gère la **collaboration en temps réel au niveau de l'éditeur de code** (Monaco Editor).
Il fournit le serveur WebSocket interne qui synchronise les curseurs, sélections et modifications de fichiers entre collaborateurs travaillant simultanément sur le même projet.

## Fichiers

| Fichier | Description |
|---------|-------------|
| `CollabServer.ts` | Gestion des rooms WebSocket (une room par projet), join/leave, broadcast des messages (edit, cursor, select, sync). |
| `PresenceManager.ts` | Suivi de présence par projet : quel utilisateur est actif, sur quel fichier, avec TTL de 30 secondes. Attribution déterministe des couleurs. |

## Consommateurs

- `app/api/collab/route.ts` — Route API WebSocket pour l'édition collaborative.
- `components/collab/CollaboratorAvatars.tsx` — Avatars des collaborateurs connectés.
- `components/collab/RemoteCursors.tsx` — Overlay des curseurs distants dans Monaco.

## Différence avec `lib/collaboration/`

| Aspect | `lib/collab/` | `lib/collaboration/` |
|--------|---------------|----------------------|
| Scope | Éditeur de code (Monaco) | Projet global (pages, composants) |
| Cursors | Ligne/colonne dans un fichier | Position x/y sur une page |
| Fonctionnalités | Rooms WS, éditions, curseurs, sélections | CRDT, commentaires, résolution de conflits, présence page |
| Composants UI | `CollaboratorAvatars`, `RemoteCursors` | `PresenceBar`, `UserCursor`, `CommentThread`, `ActivityFeed`, `ShareDialog` |

Les deux dossiers coexistent intentionnellement et ne doivent **pas** être fusionnés.
