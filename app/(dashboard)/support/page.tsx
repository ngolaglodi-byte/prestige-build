"use client";

import { LifeBuoy, MessageSquare, BookOpen, Mail } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  const resources = [
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Consultez notre documentation complète pour tout savoir sur Prestige Build.",
      href: "/docs",
      action: "Voir la documentation",
    },
    {
      icon: MessageSquare,
      title: "FAQ",
      description: "Trouvez des réponses aux questions les plus fréquemment posées.",
      href: "/docs",
      action: "Voir la FAQ",
    },
    {
      icon: Mail,
      title: "Contacter le support",
      description: "Notre équipe est disponible pour vous aider avec vos questions.",
      href: "mailto:support@prestigebuild.com",
      action: "Envoyer un email",
    },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Support</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Besoin d&apos;aide ? Nous sommes là pour vous accompagner.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {resources.map((res) => {
          const Icon = res.icon;
          return (
            <div key={res.title} className="premium-card p-6 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-smooth bg-accent/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{res.title}</h3>
                <p className="text-gray-400 text-sm">{res.description}</p>
              </div>
              <Link
                href={res.href}
                className="mt-auto text-sm text-accent hover:text-accentLight transition-colors"
              >
                {res.action} →
              </Link>
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div className="premium-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <LifeBuoy className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">État du système</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-sm text-gray-400">Tous les systèmes sont opérationnels</span>
        </div>
      </div>
    </div>
  );
}
