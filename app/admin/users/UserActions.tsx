"use client";

import { useState, useTransition } from "react";

interface UserActionsProps {
  userId: string;
  status: "ACTIVE" | "DISABLED" | "PENDING";
  onRefresh: () => void;
}

export function UserActions({ userId, status, onRefresh }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();

  async function handleActivate() {
    startTransition(async () => {
      const res = await fetch("/api/admin/users/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`Erreur: ${data.error}`);
        return;
      }
      onRefresh();
    });
  }

  async function handleDeactivate() {
    if (!confirm("Êtes-vous sûr de vouloir désactiver cet utilisateur ?")) return;
    startTransition(async () => {
      const res = await fetch("/api/admin/users/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`Erreur: ${data.error}`);
        return;
      }
      onRefresh();
    });
  }

  async function handleResetPassword() {
    startTransition(async () => {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`Erreur: ${data.error}`);
        return;
      }
      alert(`Nouveau mot de passe temporaire:\n${data.tempPassword}\n\nCommuniquez-le à l'utilisateur.`);
    });
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {status !== "ACTIVE" && (
        <button
          onClick={handleActivate}
          disabled={isPending}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Activer
        </button>
      )}
      {status !== "DISABLED" && (
        <button
          onClick={handleDeactivate}
          disabled={isPending}
          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          Désactiver
        </button>
      )}
      <button
        onClick={handleResetPassword}
        disabled={isPending}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Réinitialiser MDP
      </button>
    </div>
  );
}

export function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTempPassword(null);

    startTransition(async () => {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setTempPassword(data.tempPassword);
      setEmail("");
      setName("");
      onCreated();
    });
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8">
      <h2 className="text-xl font-semibold text-white mb-4">Créer un nouvel agent</h2>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {tempPassword && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded-lg mb-4">
          <p className="font-medium">Compte créé avec succès !</p>
          <p className="mt-2">Mot de passe temporaire:</p>
          <code className="block mt-1 bg-gray-900 p-2 rounded text-sm">{tempPassword}</code>
          <p className="mt-2 text-sm">L&apos;utilisateur devra changer ce mot de passe à la première connexion.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Prénom Nom"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="initial.nom@otc.com"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Création..." : "Créer l'agent"}
        </button>
      </form>
    </div>
  );
}
