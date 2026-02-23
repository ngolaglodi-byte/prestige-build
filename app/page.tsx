"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThreeHeroScene from "@/components/ThreeHeroScene";

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const slides = [
    "Workspace Preview Coming Soon",
    "AI Multi‑File Generation",
    "Live Preview & Deployment",
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
      <a href="#why" className="hover:text-white transition">Why Prestige Build</a>
      <a href="#features" className="hover:text-white transition">Features</a>
      <a href="#integrations" className="hover:text-white transition">Integrations</a>
      <a href="#pricing" className="hover:text-white transition">Pricing</a>
      <a href="#testimonials" className="hover:text-white transition">Testimonials</a>
    </nav>

    {/* Desktop Buttons */}
    <div className="hidden md:flex items-center gap-3">
      <Link href="/sign-in" className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10">
        Sign In
      </Link>
      <Link href="/sign-up" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
        Sign Up
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
        <a href="#why" onClick={() => setMobileOpen(false)}>Why Prestige Build</a>
        <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#integrations" onClick={() => setMobileOpen(false)}>Integrations</a>
        <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
        <a href="#testimonials" onClick={() => setMobileOpen(false)}>Testimonials</a>

        <div className="pt-2 flex gap-3">
          <Link href="/sign-in" className="flex-1 text-center px-4 py-2 bg-white/5 rounded-lg">
            Sign In
          </Link>
          <Link href="/sign-up" className="flex-1 text-center px-4 py-2 bg-blue-600 rounded-lg">
            Sign Up
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
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Build Anything with <span className="text-blue-500">Prestige Build</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Your AI-powered workspace to generate, edit, preview, and deploy full applications.
            Designed for speed, clarity, and a premium developer experience.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link href="/workspace/1" className="px-8 py-4 bg-blue-600 rounded-xl hover:bg-blue-700">
              Start Building
            </Link>
            <Link href="/dashboard" className="px-8 py-4 bg-white/10 rounded-xl hover:bg-white/20">
              View Projects
            </Link>
          </div>
        </div>
      </section>

      {/* CAROUSEL */}
      <section className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">A Workspace Built for Excellence</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            Generate, edit, preview, and deploy full applications with unmatched clarity and precision.
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
          <h3 className="text-gray-400 mb-10">Trusted by teams worldwide</h3>

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
            Why <span className="text-blue-500">Prestige Build</span>?
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-center mb-16">
            Prestige Build is not just another AI code generator. It’s a full enterprise‑grade 
            development environment designed for reliability, clarity, and long‑term scalability.
          </p>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-xl font-semibold mb-3">Enterprise‑First</h3>
              <p className="text-gray-400">
                Built with teams, compliance, and production workflows in mind from day one.
              </p>
            </div>
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-xl font-semibold mb-3">Clarity Over Chaos</h3>
              <p className="text-gray-400">
                Clean architecture, predictable outputs, and a workspace that feels crafted, not chaotic.
              </p>
            </div>
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-xl font-semibold mb-3">Future‑Proof</h3>
              <p className="text-gray-400">
                Designed to evolve with your stack, your team, and your ambitions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-[#050505]">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">
            Engineered for <span className="text-blue-500">Professionals</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5 backdrop-blur-xl">
              <h3 className="text-2xl font-semibold mb-4">AI Workspace</h3>
              <p className="text-gray-400">
                Generate, refactor, and architect full applications with enterprise‑grade precision.
              </p>
            </div>

            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5 backdrop-blur-xl">
              <h3 className="text-2xl font-semibold mb-4">Multi‑File Intelligence</h3>
              <p className="text-gray-400">
                Prestige Build understands your entire project structure, dependencies, and context.
              </p>
            </div>

            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5 backdrop-blur-xl">
              <h3 className="text-2xl font-semibold mb-4">Secure & Scalable</h3>
              <p className="text-gray-400">
                Built with modern authentication, robust architecture, and production‑ready workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section id="integrations" className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-10">Integrations</h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-center mb-16">
            Connect Prestige Build with the tools your team already uses to ship faster and safer.
          </p>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="font-semibold mb-2">GitHub</p>
              <p className="text-gray-400 text-sm">Sync repositories and branches.</p>
            </div>
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="font-semibold mb-2">Vercel</p>
              <p className="text-gray-400 text-sm">Deploy instantly from your workspace.</p>
            </div>
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="font-semibold mb-2">Supabase</p>
              <p className="text-gray-400 text-sm">Database and auth ready to go.</p>
            </div>
            <div className="p-6 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="font-semibold mb-2">Custom APIs</p>
              <p className="text-gray-400 text-sm">Bring your own services and models.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3D / WEBGL */}
      <section className="py-24 bg-[#050505] border-t border-white/5">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Immersive Visual Experience</h2>
            <p className="text-gray-400 mb-4">
              Prestige Build is designed to feel as powerful as it looks. This live 3D scene 
              showcases the depth and precision behind your workspace.
            </p>
            <p className="text-gray-500 text-sm">
              Powered by WebGL and React Three Fiber, this block is ready to evolve into a full 
              visualization of your AI workspace.
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
          <h2 className="text-4xl font-bold mb-16">Pricing</h2>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="p-10 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-2xl font-semibold mb-4">Free</h3>
              <p className="text-gray-400 mb-6">Perfect for beginners</p>
              <p className="text-4xl font-bold mb-6">$0</p>
              <ul className="text-gray-400 space-y-2 mb-6">
                <li>Basic AI generation</li>
                <li>Limited projects</li>
                <li>Community support</li>
              </ul>
              <Link href="/sign-up" className="block py-3 bg-blue-600 rounded-xl font-semibold">
                Get Started
              </Link>
            </div>

            <div className="p-10 bg-blue-600/10 rounded-2xl border border-blue-500">
              <h3 className="text-2xl font-semibold mb-4">Pro</h3>
              <p className="text-gray-400 mb-6">For serious developers</p>
              <p className="text-4xl font-bold mb-6">$19/mo</p>
              <ul className="text-gray-300 space-y-2 mb-6">
                <li>Unlimited AI generation</li>
                <li>Full workspace access</li>
                <li>Priority support</li>
              </ul>
              <Link href="/sign-up" className="block py-3 bg-blue-600 rounded-xl font-semibold">
                Upgrade
              </Link>
            </div>

            <div className="p-10 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <h3 className="text-2xl font-semibold mb-4">Enterprise</h3>
              <p className="text-gray-400 mb-6">For teams & companies</p>
              <p className="text-4xl font-bold mb-6">Custom</p>
              <ul className="text-gray-400 space-y-2 mb-6">
                <li>Team collaboration</li>
                <li>Custom AI models</li>
                <li>Dedicated support</li>
              </ul>
              <Link href="/contact" className="block py-3 bg-white/10 rounded-xl font-semibold">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-[#050505]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-16">What Developers Say</h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="text-gray-300 italic">
                “Prestige Build replaced weeks of development with minutes of clarity.”
              </p>
              <p className="mt-4 text-blue-500 font-semibold">— Alex, Senior Engineer</p>
            </div>

            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="text-gray-300 italic">
                “The closest thing to having a staff of senior engineers on demand.”
              </p>
              <p className="mt-4 text-blue-500 font-semibold">— Maya, CTO</p>
            </div>

            <div className="p-8 bg-[#0D0D0D] rounded-2xl border border-white/5">
              <p className="text-gray-300 italic">
                “From prototype to production in days instead of months.”
              </p>
              <p className="mt-4 text-blue-500 font-semibold">— Daniel, Founder</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-10 border-t border-white/10 bg-black/80">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>Prestige Build © {new Date().getFullYear()} — Crafted for creators and enterprises.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-300">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
