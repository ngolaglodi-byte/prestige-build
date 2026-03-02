"use client";

import { useState } from "react";
import Link from "next/link";

const ONBOARDING_KEY = "prestige_onboarding_done";

const steps = [
  {
    icon: "🚀",
    title: "Bienvenue sur Prestige Build",
    description:
      "Votre espace de travail propulsé par l'IA pour générer, éditer, prévisualiser et déployer des applications complètes.",
  },
  {
    icon: "📁",
    title: "Créez votre premier projet",
    description:
      "Commencez par créer un nouveau projet depuis le tableau de bord. Vous pouvez choisir un template ou partir de zéro.",
  },
  {
    icon: "✨",
    title: "Générez du code avec l'IA",
    description:
      "Utilisez le panneau IA dans l'espace de travail pour générer, refactoriser ou expliquer du code en langage naturel.",
  },
  {
    icon: "👁️",
    title: "Prévisualisez et déployez",
    description:
      "Prévisualisez vos modifications en temps réel et déployez votre application en un clic.",
  },
  {
    icon: "🎨",
    title: "Éditeur visuel & Import Figma",
    description:
      "Construisez vos interfaces par glisser-déposer sans écrire une ligne de code. Importez directement vos designs Figma pour les transformer en applications fonctionnelles.",
  },
  {
    icon: "⚡",
    title: "Créez votre première app en 2 minutes",
    description:
      "Décrivez simplement votre application et laissez l'IA générer le code complet. Aucune configuration requise — juste un prompt et c'est parti !",
    cta: { label: "Créer ma première app", href: "/create" },
  },
];

export default function OnboardingModal() {
  const [open, setOpen] = useState(() => {
    try {
      if (typeof window !== "undefined" && !localStorage.getItem(ONBOARDING_KEY)) {
        return true;
      }
    } catch {
      // localStorage indisponible
    }
    return false;
  });
  const [step, setStep] = useState(0);

  const finish = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // silencieux
    }
    setOpen(false);
  };

  if (!open) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in">
      <div className="w-full max-w-lg mx-4 bg-surface border border-border rounded-xlSmooth shadow-strong p-8 scale-in">
        {/* Indicateur d'étapes */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-accent" : "w-3 bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="text-5xl mb-4">{current.icon}</div>
          <h2 className="text-2xl font-bold mb-3 text-white">{current.title}</h2>
          <p className="text-gray-400 leading-relaxed">{current.description}</p>
          {"cta" in current && current.cta && (
            <Link
              href={(current.cta as { label: string; href: string }).href}
              onClick={finish}
              className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-smooth font-medium transition-all"
            >
              {(current.cta as { label: string; href: string }).label}
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={finish}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Passer
          </button>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-smooth transition-all duration-200"
              >
                Précédent
              </button>
            )}

            {isLast ? (
              <Link
                href="/projects"
                onClick={finish}
                className="px-6 py-2 text-sm bg-accent hover:bg-accentDark text-white rounded-smooth transition-all duration-200 font-medium"
              >
                Commencer
              </Link>
            ) : (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 text-sm bg-accent hover:bg-accentDark text-white rounded-smooth transition-all duration-200 font-medium"
              >
                Suivant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
