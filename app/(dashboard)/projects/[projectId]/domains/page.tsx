"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type Domain = {
  id: string;
  projectId: string;
  type: "subdomain" | "custom";
  host: string;
  verified: boolean;
  createdAt: string;
};

type DnsInstructions = {
  type: string;
  name: string;
  value: string;
};

export default function DomainsPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;

  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [customDomain, setCustomDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadDomains() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains`);
      const data = await res.json();
      setDomains(data.domains || []);
    } catch {
      setMessage({ text: "Erreur lors du chargement des domaines", type: "error" });
    }
    setLoading(false);
  }

  async function addCustomDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!customDomain.trim()) return;

    setAdding(true);
    setMessage(null);
    setDnsInstructions(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error || "Erreur lors de l'ajout", type: "error" });
      } else {
        setMessage({ text: "Domaine ajouté avec succès", type: "success" });
        setDnsInstructions(data.dnsInstructions);
        setCustomDomain("");
        loadDomains();
      }
    } catch {
      setMessage({ text: "Erreur réseau", type: "error" });
    }

    setAdding(false);
  }

  async function verifyDomain(domainId: string) {
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();
      setMessage({
        text: data.message,
        type: data.verified ? "success" : "error",
      });
      loadDomains();
    } catch {
      setMessage({ text: "Erreur lors de la vérification", type: "error" });
    }
  }

  async function generateSsl(domainId: string) {
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains/ssl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Erreur SSL", type: "error" });
      } else {
        setMessage({ text: data.message, type: "success" });
      }
    } catch {
      setMessage({ text: "Erreur lors de la génération SSL", type: "error" });
    }
  }

  async function deleteDomain(domainId: string) {
    if (!confirm("Supprimer ce domaine personnalisé ?")) return;

    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Erreur lors de la suppression", type: "error" });
      } else {
        setMessage({ text: "Domaine supprimé", type: "success" });
        setDnsInstructions(null);
        loadDomains();
      }
    } catch {
      setMessage({ text: "Erreur réseau", type: "error" });
    }
  }

  useEffect(() => {
    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Tableau de bord
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto mt-16 px-6 fade-in w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des domaines</h1>
            <p className="text-gray-400 mt-1">
              Configurez les domaines pour votre projet.
            </p>
          </div>
          <Link
            href={`/projects/${projectId}`}
            className="text-gray-300 hover:text-white text-sm premium-hover"
          >
            ← Retour au projet
          </Link>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-smooth text-sm ${
              message.type === "success"
                ? "bg-green-900/30 border border-green-600 text-green-400"
                : "bg-red-900/30 border border-red-600 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* DNS Instructions */}
        {dnsInstructions && (
          <div className="mb-6 premium-card p-6">
            <h3 className="text-lg font-semibold mb-3">Instructions DNS</h3>
            <p className="text-gray-400 text-sm mb-4">
              Ajoutez l&apos;enregistrement suivant dans les paramètres DNS de votre fournisseur de domaine :
            </p>
            <div className="bg-[#0a0a0a] border border-border rounded-smooth p-4 font-mono text-sm">
              <div className="flex gap-8">
                <div>
                  <span className="text-gray-500">Type :</span>{" "}
                  <span className="text-accent">{dnsInstructions.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Nom :</span>{" "}
                  <span className="text-white">{dnsInstructions.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Valeur :</span>{" "}
                  <span className="text-green-400">{dnsInstructions.value}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Domain list */}
        <div className="premium-card p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Domaines actifs</h2>

          {loading ? (
            <p className="text-gray-400">Chargement…</p>
          ) : domains.length === 0 ? (
            <p className="text-gray-400">Aucun domaine configuré.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 bg-surfaceLight border border-border rounded-smooth"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{domain.host}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {domain.type === "subdomain" ? "Sous-domaine par défaut" : "Domaine personnalisé"}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        domain.verified
                          ? "bg-green-900/40 text-green-400 border border-green-700"
                          : "bg-yellow-900/40 text-yellow-400 border border-yellow-700"
                      }`}
                    >
                      {domain.verified ? "Actif" : "En attente"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {domain.type === "custom" && !domain.verified && (
                      <button
                        onClick={() => verifyDomain(domain.id)}
                        className="px-3 py-1.5 text-xs bg-blue-600 rounded-smooth hover:bg-blue-700"
                      >
                        Vérifier DNS
                      </button>
                    )}

                    {domain.type === "custom" && domain.verified && (
                      <button
                        onClick={() => generateSsl(domain.id)}
                        className="px-3 py-1.5 text-xs bg-purple-600 rounded-smooth hover:bg-purple-700"
                      >
                        Certificat SSL
                      </button>
                    )}

                    {domain.type === "custom" && (
                      <button
                        onClick={() => deleteDomain(domain.id)}
                        className="px-3 py-1.5 text-xs bg-red-600/80 rounded-smooth hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add custom domain */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold mb-4">Ajouter un domaine personnalisé</h2>
          <p className="text-gray-400 text-sm mb-4">
            Entrez votre nom de domaine. Vous devrez ensuite configurer un enregistrement CNAME
            pointant vers <code className="text-accent">cname.prestige-build.dev</code>.
          </p>

          <form onSubmit={addCustomDomain} className="flex gap-3">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="exemple.com"
              className="flex-1 px-4 py-2 rounded-smooth bg-[#111] border border-border text-sm"
            />
            <button
              type="submit"
              disabled={adding || !customDomain.trim()}
              className="px-4 py-2 bg-accent rounded-smooth hover:bg-accent/80 disabled:opacity-50 text-sm"
            >
              {adding ? "Ajout…" : "Ajouter"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
