"use client";

export default function DeploymentsPage() {
  const deployments = [
    { id: "dep_001", status: "success", url: "https://project.vercel.app", time: "2 hours ago" },
    { id: "dep_002", status: "building", url: "—", time: "Yesterday" },
    { id: "dep_003", status: "failed", url: "—", time: "3 days ago" },
  ];

  return (
    <div className="fade-in max-w-3xl">

      <h1 className="text-3xl font-bold tracking-tight mb-8">Déploiements</h1>

      <div className="flex flex-col gap-4">
        {deployments.map((d) => (
          <div key={d.id} className="premium-card p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{d.id}</div>
              <div className="text-gray-400 text-sm">{d.time}</div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-smooth text-sm ${
                  d.status === "success"
                    ? "bg-green-600/20 text-green-400"
                    : d.status === "failed"
                    ? "bg-red-600/20 text-red-400"
                    : "bg-yellow-600/20 text-yellow-400"
                }`}
              >
                {d.status}
              </span>

              <span className="text-accent text-sm">{d.url}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
