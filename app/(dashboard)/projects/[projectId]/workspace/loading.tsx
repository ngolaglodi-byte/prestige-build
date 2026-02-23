export default function ProjectWorkspaceLoading() {
  return (
    <div className="flex h-full animate-pulse">
      {/* Arborescence skeleton */}
      <div className="w-64 border-r border-white/10 p-3 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-5 bg-surface/50 rounded w-full" />
        ))}
      </div>

      {/* Zone éditeur skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-10 border-b border-white/10 flex items-center gap-2 px-3">
          <div className="h-6 w-24 bg-surface rounded" />
        </div>
        <div className="flex-1 bg-editor" />
      </div>

      {/* Panneau IA skeleton */}
      <div className="w-80 border-l border-white/10 p-3 space-y-3">
        <div className="h-6 w-20 bg-surface rounded" />
        <div className="h-16 bg-surface/50 rounded" />
      </div>
    </div>
  );
}
