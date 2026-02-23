"use client";

export function FileActionsMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
        }}
        className="text-xs text-blue-400 hover:text-blue-200"
      >
        Renommer
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-xs text-red-400 hover:text-red-200"
      >
        Supprimer
      </button>
    </div>
  );
}
