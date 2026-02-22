"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center px-6">

      {/* Logo */}
      <div className="mb-10 fade-in">
        <Logo />
      </div>

      {/* Card */}
      <div className="premium-card p-8 w-full max-w-md fade-in flex flex-col gap-6">

        <h1 className="text-2xl font-bold tracking-tight text-center">
          Reset Your Password
        </h1>

        <p className="text-gray-400 text-sm text-center">
          Enter your email and we’ll send you a reset link.
        </p>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-300">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
          />
        </div>

        {/* CTA */}
        <button className="w-full px-4 py-3 bg-accent rounded-smooth premium-hover shadow-soft text-lg">
          Send Reset Link
        </button>

        {/* Divider */}
        <div className="h-px bg-border my-2"></div>

        {/* Back to Login */}
        <p className="text-center text-gray-400 text-sm">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-accent premium-hover">
            Login
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
