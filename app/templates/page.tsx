"use client";

import Link from "next/link";

export default function TemplatesMarketplacePage() {
  const templates = [
    {
      id: "landing",
      name: "Landing Page",
      description: "A clean and modern landing page.",
    },
    {
      id: "ecommerce",
      name: "E‑commerce Starter",
      description: "A full e‑commerce UI with product pages.",
    },
    {
      id: "dashboard",
      name: "Admin Dashboard",
      description: "A complete dashboard layout.",
    },
  ];

  return (
    <div className="fade-in">

      <h1 className="text-3xl font-bold tracking-tight mb-8">Templates Marketplace</h1>

      <div className="grid grid-cols-3 gap-6">
        {templates.map((t) => (
          <div key={t.id} className="premium-card p-6 flex flex-col gap-4">
            <div className="text-xl font-semibold">{t.name}</div>
            <div className="text-gray-400 text-sm">{t.description}</div>

            <Link
              href={`/projects/new?template=${t.id}`}
              className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit"
            >
              Use Template
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
