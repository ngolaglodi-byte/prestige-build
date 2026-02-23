"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useState } from "react";

export default function TeamPage() {
  const [email, setEmail] = useState("");

  const members = [
    { name: "Glody", role: "Owner" },
    { name: "Sarah", role: "Developer" },
  ];

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Back to Dashboard
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-16 px-6 fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Team & Collaboration</h1>

        {/* Members */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">Team Members</h2>

          {members.map((m) => (
            <div key={m.name} className="flex justify-between border-b border-border pb-3">
              <span>{m.name}</span>
              <span className="text-gray-400">{m.role}</span>
            </div>
          ))}
        </div>

        {/* Invite */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Invite Member</h2>

          <input
            type="email"
            placeholder="member@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
          />

          <button className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit">
            Send Invite
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
