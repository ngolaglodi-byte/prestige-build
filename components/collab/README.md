# components/collab/ — Code-Editor Collaboration UI

> Prestige Build — Prestige Technologie Company, fondée par Glody Dimputu Ngola.

Composants React pour la collaboration en temps réel **dans l'éditeur de code** (Monaco Editor).

| Composant | Description |
|-----------|-------------|
| `CollaboratorAvatars.tsx` | Avatars empilés des collaborateurs connectés (style GitHub/Figma). |
| `RemoteCursors.tsx` | Overlay affichant les curseurs distants dans Monaco avec label et couleur. |

Ces composants consomment `hooks/useCollaboration` et sont utilisés dans `app/(dashboard)/workspace/[id]/page.tsx`.

Voir `lib/collab/README.md` pour la logique métier associée.
