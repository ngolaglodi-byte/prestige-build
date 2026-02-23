"use client";

import Link from "next/link";

export default function ProjectFilesPage({ params }: any) {
  const files = [
    { path: "src/App.tsx", size: "2.1 KB" },
    { path: "src/index.tsx", size: "1.4 KB" },
    { path: "package.json", size: "0.8 KB" },
  ];

  return (
    <div className="fade-in max-w-3xl">

      <h1 className="text-3xl font-bold tracking-tight mb-8">Files</h1>

      <div className="premium-card p-6 flex flex-col gap-4">
        {files.map((f) => (
          <div key={f.path} className="flex justify-between items-center">
            <span>{f.path}</span>
            <span className="text-gray-400 text-sm">{f.size}</span>
          </div>
        ))}
      </div>

      <Link
        href={`/workspace/${params.id}`}
        className="mt-6 inline-block px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft"
      >
        Open in Workspace
      </Link>
    </div>
  );
}
