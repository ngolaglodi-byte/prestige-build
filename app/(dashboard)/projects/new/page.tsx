"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("next");

  const templates = [
    { id: "next", label: "Next.js Starter" },
    { id: "react", label: "React Starter" },
    { id: "landing", label: "Landing Page" },
    { id: "ecommerce", label: "E‑commerce Starter" },
  ];

  return (
    <div className="fade-in max-w-2xl">

      <h1 className="text-3xl font-bold tracking-tight mb-8">Create New Project</h1>

      <div className="premium-card p-6 flex flex-col gap-6">

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Project Name</label>
          <input
            type="text"
            placeholder="My Awesome Project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2"
          />
        </div>

        {/* Templates */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Template</label>

          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`p-4 rounded-smooth border premium-hover text-left ${
                  template === t.id
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-surface border-border text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create */}
        <button className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit">
          Create Project
        </button>
      </div>
    </div>
  );
}
