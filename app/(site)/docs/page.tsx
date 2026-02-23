"use client";

import Logo from "@/components/Logo";
import Link from "next/link";

export default function DeveloperDocsPage() {
  const sections = [
    {
      title: "Authentification",
      description: "Comment vous authentifier avec vos clés API.",
      link: "#auth",
    },
    {
      title: "Générer du code",
      description: "Utilisez l'API Prestige Build pour générer du code de manière programmatique.",
      link: "#generate",
    },
    {
      title: "Webhooks",
      description: "Recevez des événements de Prestige Build, Stripe et Pawapay.",
      link: "#webhooks",
    },
    {
      title: "Exemples",
      description: "Exemples prêts à copier‑coller en JavaScript, Python et cURL.",
      link: "#examples",
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Retour au tableau de bord
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center mt-20 fade-in px-6">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          <span className="text-accent">Documentation</span> développeur
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Tout ce dont vous avez besoin pour intégrer Prestige Build dans vos applications.
        </p>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto mt-16 px-6">
        {sections.map((s) => (
          <Link
            key={s.title}
            href={s.link}
            className="premium-card p-6 hover:bg-white/5 transition-all"
          >
            <h2 className="text-xl font-semibold">{s.title}</h2>
            <p className="text-gray-400 text-sm mt-2">{s.description}</p>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
