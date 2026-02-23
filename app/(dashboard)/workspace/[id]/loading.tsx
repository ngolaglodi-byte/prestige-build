export default function WorkspaceLoading() {
  return (
    <div className="h-screen w-full flex bg-bg text-white overflow-hidden animate-pulse">
      {/* Sidebar skeleton */}
      <div className="w-64 h-full bg-[#111] border-r border-white/10 flex-shrink-0 p-3 space-y-2">
        <div className="h-6 w-24 bg-surface rounded mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-5 bg-surface/50 rounded w-full" />
        ))}
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Onglets skeleton */}
        <div className="h-10 border-b border-white/10 flex items-center gap-2 px-3">
          <div className="h-6 w-24 bg-surface rounded" />
          <div className="h-6 w-20 bg-surface/50 rounded" />
        </div>

        {/* Éditeur skeleton */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-editor" />
          {/* Panneau IA skeleton */}
          <div className="w-80 border-l border-white/10 p-3 space-y-3">
            <div className="h-6 w-20 bg-surface rounded" />
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 w-16 bg-surface/50 rounded" />
              ))}
            </div>
            <div className="flex-1" />
            <div className="h-16 bg-surface rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
