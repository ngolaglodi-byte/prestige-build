"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function PricingPage() {
  const plans = [
    {
      name: "Gratuit",
      price: "0 $",
      description: "Idéal pour découvrir Prestige Build.",
      features: [
        "1 projet",
        "10 générations IA / mois",
        "100 Mo d'espace de travail",
        "Templates communautaires",
        "Aperçu limité",
      ],
      cta: "Commencer gratuitement",
      accent: false,
    },
    {
      name: "Pro",
      price: "20 $/mois",
      description: "Pour les créateurs qui veulent la puissance complète.",
      features: [
        "20 projets",
        "500 générations IA / mois",
        "2 Go d'espace de travail",
        "Génération IA avancée",
        "Export vers GitHub",
        "Déploiement Vercel",
        "Aperçu complet",
      ],
      cta: "Passer au Pro",
      accent: true,
    },
    {
      name: "Enterprise",
      price: "70 $/mois",
      description: "Pour les équipes et grandes organisations.",
      features: [
        "Projets illimités",
        "2000 générations IA / mois",
        "10 Go d'espace de travail",
        "Modèles IA personnalisés",
        "Collaboration d'équipe",
        "Cloud privé",
        "Support dédié",
        "SLA & onboarding",
      ],
      cta: "Choisir Enterprise",
      accent: false,
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Tableau de bord
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center mt-20 fade-in px-6">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Tarification simple et <span className="text-accent">transparente</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Choisissez le plan qui correspond à votre flux de travail. Passez à un plan supérieur à tout moment.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20 px-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`premium-card p-8 flex flex-col ${
              plan.accent ? "border-accent shadow-soft" : ""
            }`}
          >
            <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-4xl font-bold mb-4">{plan.price}</p>
            <p className="text-gray-400 mb-6">{plan.description}</p>

            <div className="flex flex-col gap-2 mb-8">
              {plan.features.map((f) => (
                <div key={f} className="text-gray-300 flex items-center gap-2">
                  <span className="text-accent">•</span> {f}
                </div>
              ))}
            </div>

            <Link
              href="/billing"
              className={`w-full text-center px-4 py-3 rounded-smooth premium-hover mt-auto ${
                plan.accent
                  ? "bg-accent shadow-soft"
                  : "bg-surface border border-border"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Limites d'utilisation */}
      <div className="max-w-6xl mx-auto mt-20 px-6 w-full fade-in">
        <h2 className="text-3xl font-bold text-center mb-10">
          Limites d&apos;utilisation par plan
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-4 px-4 text-gray-400 font-medium">Fonctionnalité</th>
                <th className="py-4 px-4 text-gray-400 font-medium">Gratuit</th>
                <th className="py-4 px-4 text-accent font-medium">Pro</th>
                <th className="py-4 px-4 text-gray-400 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4">Générations IA / mois</td>
                <td className="py-3 px-4">10</td>
                <td className="py-3 px-4 text-accent">500</td>
                <td className="py-3 px-4">2 000</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4">Espace de travail</td>
                <td className="py-3 px-4">100 Mo</td>
                <td className="py-3 px-4 text-accent">2 Go</td>
                <td className="py-3 px-4">10 Go</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4">Nombre de projets</td>
                <td className="py-3 px-4">1</td>
                <td className="py-3 px-4 text-accent">20</td>
                <td className="py-3 px-4">Illimité</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4">Paiement Mobile Money</td>
                <td className="py-3 px-4">—</td>
                <td className="py-3 px-4 text-accent">✓</td>
                <td className="py-3 px-4">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
