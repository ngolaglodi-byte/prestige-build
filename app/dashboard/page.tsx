export default function DashboardPage() {
  const projects = [
    { id: 1, name: "Landing Page AI", updated: "2 hours ago" },
    { id: 2, name: "E‑commerce Starter", updated: "Yesterday" },
    { id: 3, name: "Portfolio Modern", updated: "3 days ago" },
  ];

  return (
    <div className="min-h-screen bg-bg text-white px-8 py-10 fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button className="premium-card px-5 py-2 premium-hover">
          New Project
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="premium-card p-6">
          <p className="text-sm opacity-70">Projects</p>
          <p className="text-3xl font-bold mt-2">12</p>
        </div>

        <div className="premium-card p-6">
          <p className="text-sm opacity-70">AI Generations</p>
          <p className="text-3xl font-bold mt-2">87</p>
        </div>

        <div className="premium-card p-6">
          <p className="text-sm opacity-70">Time Saved</p>
          <p className="text-3xl font-bold mt-2">14h</p>
        </div>
      </div>

      {/* RECENT PROJECTS */}
      <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
      <div className="space-y-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="premium-card p-4 flex items-center justify-between premium-hover"
          >
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm opacity-60">Updated {p.updated}</p>
            </div>

            <button className="px-4 py-2 bg-accent rounded-smooth premium-hover">
              Open
            </button>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <p className="text-center opacity-50 mt-16">
        Prestige Build © 2026 — Crafted for creators
      </p>
    </div>
  );
}
