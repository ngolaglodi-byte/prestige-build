"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect to explore Prestige Build.",
      features: [
        "1 Project",
        "Basic AI generation",
        "Community templates",
        "Limited preview time",
      ],
      cta: "Get Started",
      accent: false,
    },
    {
      name: "Pro",
      price: "$19/mo",
      description: "For creators who want full power.",
      features: [
        "Unlimited projects",
        "Advanced AI generation",
        "Full preview performance",
        "Export to GitHub",
        "Deploy to Vercel",
      ],
      cta: "Upgrade to Pro",
      accent: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and large organizations.",
      features: [
        "Team collaboration",
        "Custom AI models",
        "Private cloud",
        "Dedicated support",
        "SLA & onboarding",
      ],
      cta: "Contact Sales",
      accent: false,
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Dashboard
        </Link>
      </div>

      {/* Hero */}
      <div className="text-center mt-20 fade-in px-6">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Simple, Transparent <span className="text-accent">Pricing</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Choose the plan that fits your workflow. Upgrade anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto mt-20 px-6">
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
              href="/workspace/1"
              className={`w-full text-center px-4 py-3 rounded-smooth premium-hover ${
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

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
