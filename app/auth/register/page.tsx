"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center px-6">

      {/* Logo */}
      <div className="mb-10 fade-in">
        <Logo />
      </div>

      {/* Card */}
      <div className="premium-card p-8 w-full max-w-md fade-in flex flex-col gap-6">

        <h1 className="text-2xl font-bold tracking-tight text-center">
          Créer votre compte
        </h1>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Adresse e-mail</label>
          <input
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
          />
        </div>

        {/* Mot de passe */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Mot de passe</label>
          <input
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
          />
        </div>

        {/* Confirmer le mot de passe */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Confirmer le mot de passe</label>
          <input
            type="password"
            placeholder="••••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
          />
        </div>

        {/* CTA */}
        <button className="w-full px-4 py-3 bg-accent rounded-smooth premium-hover shadow-soft text-lg">
          Créer un compte
        </button>

        {/* Séparateur */}
        <div className="h-px bg-border my-2"></div>

        {/* Lien de connexion */}
        <p className="text-center text-gray-400 text-sm">
          Vous avez déjà un compte ?{" "}
          <Link href="/auth/login" className="text-accent premium-hover">
            Se connecter
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-10 text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
