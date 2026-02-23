"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
};

export default function TeamPage() {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  function loadMembers() {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function inviteMember() {
    if (!email) return;
    await fetch("/api/team", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    setEmail("");
    loadMembers();
  }

  async function removeMember(id: string) {
    await fetch("/api/team", {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    loadMembers();
  }

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

          {loading ? (
            <p className="text-gray-400">Loading team...</p>
          ) : members.length === 0 ? (
            <p className="text-gray-400">No team members yet. Invite someone below.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex justify-between items-center border-b border-border pb-3">
                <div>
                  <span className="font-semibold">{m.name || m.email}</span>
                  <span className="text-gray-400 text-sm ml-2">({m.role})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-smooth ${
                    m.status === "active" ? "bg-green-600/20 text-green-400" : "bg-yellow-600/20 text-yellow-400"
                  }`}>
                    {m.status}
                  </span>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
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

          <button
            onClick={inviteMember}
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit"
          >
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
