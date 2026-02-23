export default function DashboardLoading() {
  return (
    <div className="flex-1 p-8 space-y-6 animate-pulse">
      {/* En-tête skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-surface rounded-smooth" />
        <div className="h-10 w-32 bg-surface rounded-smooth" />
      </div>

      {/* Grille de cartes skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 bg-surface border border-border rounded-xlSmooth"
          />
        ))}
      </div>
    </div>
  );
}
