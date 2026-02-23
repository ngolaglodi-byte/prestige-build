"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThreeHeroScene from "@/components/ThreeHeroScene";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const slides = [
    "Aperçu de l’espace de travail bientôt disponible",
    "Génération IA multi‑fichiers",
    "Aperçu en direct et déploiement",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col">

      {/* HEADER STICKY */}
      <header className="fixed top-0 inset-x-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
  <div className="container mx-auto px-6 py-4 flex items-center justify-between">
    <Logo />

    {/* Desktop Navigation */}
    <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
      <a href="#why" className="hover:text-white transition">Pourquoi Prestige Build</a>
      <a href="#features" className="hover:text-white transition">Fonctionnalités</a>
      <a href="#integrations" className="hover:text-white transition">Intégrations</a>
      <a href="#pricing" className="hover:text-white transition">Tarification</a>
      <a href="#testimonials" className="hover:text-white transition">Témoignages</a>
    </nav>

    {/* Desktop Buttons */}
    <div className="hidden md:flex items-center gap-3">
      <Link href="/sign-in" className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10">
        Se connecter
      </Link>
      <Link href="/sign-up" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
        S’inscrire
      </Link>
    </div>

    {/* Mobile menu button */}
    <button
      className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/5"
      onClick={() => setMobileOpen(!mobileOpen)}
    >
      <div className="space-y-1.5">
        <span className="block h-0.5 w-5 bg-white" />
        <span className="block h-0.5 w-5 bg-white" />
        <span className="block h-0.5 w-5 bg-white" />
      </div>
    </button>
  </div>

  {/* Mobile Menu */}
  {mobileOpen && (
    <div className="md:hidden border-t border-white/10 bg-black/90">
      <div className="px-6 py-4 space-y-3 text-sm text-gray-200">
        <a href="#why" onClick={() => setMobileOpen(false)}>Pourquoi Prestige Build</a>
        <a href="#features" onClick={() => setMobileOpen(false)}>Fonctionnalités</a>
        <a href="#integrations" onClick={() => setMobileOpen(false)}>Intégrations</a>
        <a href="#pricing" onClick={() => setMobileOpen(false)}>Tarification</a>
        <a href="#testimonials" onClick={() => setMobileOpen(false)}>Témoignages</a>

        <div className="pt-2 flex gap-3">
          <Link href="/sign-in" className="flex-1 text-center px-4 py-2 bg-white/5 rounded-lg">
            Se connecter
          </Link>
          <Link href="/sign-up" className="flex-1 text-center px-4 py-2 bg-blue-600 rounded-lg">
            S’inscrire
          </Link>
        </div>
      </div>
    </div>
  )}
</header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-40 pb-40">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent blur-3xl" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight slide-up">
            Construisez tout avec <span className="text-blue-500">Prestige Build</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto slide-up stagger-2">
            Votre espace de travail propulsé par l’IA pour générer, éditer, prévisualiser et déployer des applications complètes.
            Conçu pour la rapidité, la clarté et une expérience développeur premium.
          </p>

          <div className="mt-10 flex justify-center gap-4 slide-up stagger-3">
            <Link href="/workspace/1" className="px-8 py-4 bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 hover:-translate-y-0.5">
              Commencer à construire
            </Link>
            <Link href="/dashboard" className="px-8 py-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5">
              Voir les projets
            </Link>
          </div>
        </div>
      </section>

      {/* CAROUSEL */}
      <section className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Un espace de travail conçu pour l’excellence</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            Générez, éditez, prévisualisez et déployez des applications complètes avec une clarté et une précision inégalées.
          </p>

          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            <div className="bg-black h-[500px] flex items-center justify-center text-gray-500 text-2xl transition-all duration-700">
              {slides[currentSlide]}
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition ${
                    i === currentSlide ? "bg-blue-500" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT LOGOS */}
      <section className="py-20 bg-[#050505]">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-gray-400 mb-10">Adopté par des équipes dans le monde entier</h3>

          <div className="flex flex-wrap justify-center gap-12 opacity-80">
            <div className="text-2xl font-bold">TechNova</div>
            <div className="text-2xl font-bold">SkyForge</div>
            <div className="text-2xl font-bold">NeuraSoft</div>
            <div className="text-2xl font-bold">QuantumOps</div>
            <div className="text-2xl font-bold">ApexAI</div>
          </div>
        </div>
      </section>

      {/* WHY PRESTIGE BUILD */}
      <section id="why" className="py-24 bg-[#050505] border-t border-white/5">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-10">
            Pourquoi <span className="text-blue-500">Prestige Build</span> ?
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-center mb-16">
            Prestige Build n’est pas un simple générateur de code IA. C’est un environnement de développement
            de qualité entreprise conçu pour la fiabilité, la clarté et la scalabilité à long terme.
          </p>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-xl font-semibold mb-3">Entreprise d’abord</h3>
              <p className="text-gray-400">
                Conçu dès le départ pour les équipes, la conformité et les flux de production.
              </p>
            </div>
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-xl font-semibold mb-3">La clarté avant le chaos</h3>
              <p className="text-gray-400">
                Architecture propre, résultats prévisibles et un espace de travail soigné, pas chaotique.
              </p>
            </div>
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-xl font-semibold mb-3">Pérenne</h3>
              <p className="text-gray-400">
                Conçu pour évoluer avec votre stack, votre équipe et vos ambitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-[#050505]">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">
            Conçu pour les <span className="text-blue-500">professionnels</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5 backdrop-blur-xl premium-hover">
              <h3 className="text-2xl font-semibold mb-4">Espace de travail IA</h3>
              <p className="text-gray-400">
                Générez, refactorisez et concevez des applications complètes avec une précision de qualité entreprise.
              </p>
            </div>

            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5 backdrop-blur-xl premium-hover">
              <h3 className="text-2xl font-semibold mb-4">Intelligence multi‑fichiers</h3>
              <p className="text-gray-400">
                Prestige Build comprend la structure complète de votre projet, les dépendances et le contexte.
              </p>
            </div>

            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5 backdrop-blur-xl premium-hover">
              <h3 className="text-2xl font-semibold mb-4">Sécurisé et scalable</h3>
              <p className="text-gray-400">
                Construit avec une authentification moderne, une architecture robuste et des flux prêts pour la production.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-10">Intégrations</h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-center mb-16">
            Connectez Prestige Build aux outils que votre équipe utilise déjà pour livrer plus vite et plus sûrement.
          </p>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="font-semibold mb-2">GitHub</p>
              <p className="text-gray-400 text-sm">Synchronisez les dépôts et les branches.</p>
            </div>
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="font-semibold mb-2">Vercel</p>
              <p className="text-gray-400 text-sm">Déployez instantanément depuis votre espace de travail.</p>
            </div>
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="font-semibold mb-2">Supabase</p>
              <p className="text-gray-400 text-sm">Base de données et authentification prêtes à l’emploi.</p>
            </div>
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="font-semibold mb-2">API personnalisées</p>
              <p className="text-gray-400 text-sm">Intégrez vos propres services et modèles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3D / WEBGL */}
      <section className="py-24 bg-[#050505] border-t border-white/5">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Expérience visuelle immersive</h2>
            <p className="text-gray-400 mb-4">
              Prestige Build est conçu pour être aussi puissant qu’il en a l’air. Cette scène 3D en direct
              illustre la profondeur et la précision derrière votre espace de travail.
            </p>
            <p className="text-gray-500 text-sm">
              Propulsé par WebGL et React Three Fiber, ce bloc est prêt à évoluer vers une visualisation
              complète de votre espace de travail IA.
            </p>
          </div>

          <div className="relative h-72 md:h-80 rounded-3xl bg-gradient-to-br from-blue-500/30 via-transparent to-purple-500/30 border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />
            <div className="relative h-full">
              <ThreeHeroScene />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-16">Tarification</h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="p-10 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-2xl font-semibold mb-4">Gratuit</h3>
              <p className="text-gray-400 mb-6">Idéal pour les débutants</p>
              <p className="text-4xl font-bold mb-6">0 $</p>
              <ul className="text-gray-400 space-y-2 mb-6">
                <li>Génération IA de base</li>
                <li>Projets limités</li>
                <li>Support communautaire</li>
              </ul>
              <Link href="/sign-up" className="block py-3 bg-blue-600 rounded-xl font-semibold">
                Commencer
              </Link>
            </div>

            <div className="p-10 bg-blue-600/10 rounded-2xl border border-blue-500">
              <h3 className="text-2xl font-semibold mb-4">Pro</h3>
              <p className="text-gray-400 mb-6">Pour les développeurs sérieux</p>
              <p className="text-4xl font-bold mb-6">19 $/mois</p>
              <ul className="text-gray-300 space-y-2 mb-6">
                <li>Génération IA illimitée</li>
                <li>Accès complet à l’espace de travail</li>
                <li>Support prioritaire</li>
              </ul>
              <Link href="/sign-up" className="block py-3 bg-blue-600 rounded-xl font-semibold">
                Passer au supérieur
              </Link>
            </div>

            <div className="p-10 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-2xl font-semibold mb-4">Enterprise</h3>
              <p className="text-gray-400 mb-6">Pour les équipes et entreprises</p>
              <p className="text-4xl font-bold mb-6">Sur mesure</p>
              <ul className="text-gray-400 space-y-2 mb-6">
                <li>Collaboration d’équipe</li>
                <li>Modèles IA personnalisés</li>
                <li>Support dédié</li>
              </ul>
              <Link href="/contact" className="block py-3 bg-white/10 rounded-xl font-semibold">
                Contacter les ventes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-[#050505]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-16">Ce que disent les développeurs</h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="text-gray-300 italic">
                “Prestige Build a remplacé des semaines de développement par des minutes de clarté.”
              </p>
              <p className="mt-4 text-blue-500 font-semibold">— Alex, ingénieur senior</p>
            </div>

            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="text-gray-300 italic">
                “L’outil le plus proche d’avoir une équipe d’ingénieurs seniors à la demande.”
              </p>
              <p className="mt-4 text-blue-500 font-semibold">— Maya, directrice technique</p>
            </div>

            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="text-gray-300 italic">
                “Du prototype à la production en quelques jours au lieu de plusieurs mois.”
              </p>
              <p className="mt-4 text-blue-500 font-semibold">— Daniel, fondateur</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-10 border-t border-white/10 bg-black/80">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>Prestige Build © {new Date().getFullYear()} — Conçu pour les créateurs et les entreprises.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-300">Confidentialité</Link>
            <Link href="/terms" className="hover:text-gray-300">Conditions</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
