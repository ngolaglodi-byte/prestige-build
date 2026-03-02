"use client";

// components/collab/CollaboratorAvatars.tsx
// Displays small coloured avatar circles for each connected collaborator.

interface Collaborator {
  id: string;
  name: string;
  color: string;
  fileId?: string;
}

interface Props {
  collaborators: Collaborator[];
}

export function CollaboratorAvatars({ collaborators }: Props) {
  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {collaborators.map((c) => (
        <div
          key={c.id}
          title={`${c.name}${c.fileId ? ` — ${c.fileId}` : ""}`}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-gray-900 cursor-default"
          style={{ backgroundColor: c.color }}
        >
          {c.name.charAt(0).toUpperCase()}
        </div>
      ))}
      <span className="text-xs text-gray-500 ml-1">
        {collaborators.length} en ligne
      </span>
    </div>
  );
}

export default CollaboratorAvatars;
