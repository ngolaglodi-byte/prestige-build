"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { useEffect, useState } from "react";

type RatesData = {
  country: string;
  currency: string;
  symbol: string;
  rate: number;
  plans: Record<string, { priceUsd: number; priceLocal: number; currency: string }>;
};

const BASE_PLANS = [
  { id: "pro", name: "Pro", credits: 500, price: 20 },
  { id: "enterprise", name: "Enterprise", credits: 2000, price: 70 },
];

type HistoryItem = {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type PlanLimits = {
  aiGenerations: number;
  workspaceSizeMb: number;
  maxProjects: number;
};

export default function BillingPage() {
  const [method, setMethod] = useState("mobile");
  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState(0);
  const [creditsMonthly, setCreditsMonthly] = useState(0);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [rates, setRates] = useState<RatesData | null>(null);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((data) => {
        setPlan(data.plan ?? "free");
        setCredits(data.credits ?? 0);
        setCreditsMonthly(data.creditsMonthly ?? 0);
        setLimits(data.limits ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/billing/history")
      .then((r) => r.json())
      .then((data) => {
        setHistory(data.history ?? []);
        setHistoryLoading(false);
      })
      .catch(() => setHistoryLoading(false));

    fetch("/api/billing/rates")
      .then((r) => r.json())
      .then(setRates)
      .catch(() => {});
  }, []);

  const currencyCode = rates?.currency ?? "USD";
  const currencySymbol = rates?.symbol ?? "$";
  const showUsdHint = currencyCode !== "USD";

  const PLANS = BASE_PLANS.map((p) => {
    const r = rates?.plans[p.id];
    return {
      ...p,
      priceLocal: r?.priceLocal ?? p.price,
    };
  });

  const handlePayment = async () => {
    if (!phone.trim()) return;
    setPaying(true);
    setPayResult(null);
    try {
      const res = await fetch("/api/billing/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          phoneNumber: phone,
          currency: currencyCode,
          country: rates?.country,
        }),
      });
      const data = await res.json();
      setPayResult({
        success: res.ok,
        message: data.message ?? data.error ?? "Erreur inconnue",
      });
      if (res.ok) {
        const billingRes = await fetch("/api/billing");
        const billingData = await billingRes.json();
        setPlan(billingData.plan ?? plan);
        setCredits(billingData.credits ?? credits);
        setCreditsMonthly(billingData.creditsMonthly ?? 0);
        setLimits(billingData.limits ?? null);

        const historyRes = await fetch("/api/billing/history");
        const historyData = await historyRes.json();
        setHistory(historyData.history ?? []);
      }
    } catch {
      setPayResult({ success: false, message: "Erreur réseau" });
    } finally {
      setPaying(false);
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Complété";
      case "pending": return "En attente";
      case "failed": return "Échoué";
      case "renewed": return "Renouvelé";
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": case "renewed": return "text-green-400";
      case "pending": return "text-yellow-400";
      case "failed": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Topbar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-border bg-[#111]/80 backdrop-blur-md">
        <Logo />
        <Link href="/dashboard" className="text-gray-300 hover:text-white premium-hover">
          Retour au tableau de bord
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto mt-16 px-6 fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Facturation & Paiements</h1>

        {/* Subscription */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">Abonnement actuel</h2>

          {loading ? (
            <p className="text-gray-400">Chargement...</p>
          ) : (
            <>
              <p className="text-gray-400">
                Vous êtes actuellement sur le <span className="text-accent capitalize">Plan {plan === "free" ? "Gratuit" : plan}</span>.
              </p>
              <p className="text-gray-400">
                Crédits restants : <span className="text-white font-semibold">{credits}</span> / {creditsMonthly}
              </p>
              {limits && (
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-sm text-gray-500">Générations IA : {limits.aiGenerations} / mois</p>
                  <p className="text-sm text-gray-500">Espace de travail : {limits.workspaceSizeMb >= 1000 ? `${limits.workspaceSizeMb / 1000} Go` : `${limits.workspaceSizeMb} Mo`}</p>
                  <p className="text-sm text-gray-500">Projets : {limits.maxProjects === -1 ? "Illimité" : limits.maxProjects}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Payment Method */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">Méthode de paiement</h2>

          <div className="flex gap-4">
            <button
              onClick={() => setMethod("mobile")}
              className={`px-4 py-2 rounded-smooth border premium-hover transition-all ${
                method === "mobile"
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border bg-surface text-gray-300 hover:text-white"
              }`}
            >
              Mobile Money (PawaPay)
            </button>

            <button
              onClick={() => setMethod("card")}
              className={`px-4 py-2 rounded-smooth border premium-hover transition-all ${
                method === "card"
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border bg-surface text-gray-300 hover:text-white"
              }`}
            >
              Carte bancaire
            </button>
          </div>

          {method === "mobile" && (
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Numéro Mobile Money</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+243 970 000 000"
                  className="w-full bg-surfaceLight border border-border rounded-smooth px-4 py-2 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Plan selection */}
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Choisir un plan</label>
                <div className="grid grid-cols-2 gap-3">
                  {PLANS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id)}
                      className={`p-3 rounded-smooth border text-left premium-hover transition-all ${
                        selectedPlan === p.id
                          ? "border-accent bg-accent/20"
                          : "border-border bg-surface"
                      }`}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-sm text-gray-400">{p.credits} crédits</div>
                      <div className="text-accent text-sm">
                        {p.priceLocal.toLocaleString("fr-FR")} {currencySymbol}/mois
                      </div>
                      {showUsdHint && (
                        <div className="text-xs text-gray-500">soit {p.price} $ USD</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={paying || !phone.trim()}
                className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit disabled:opacity-50"
              >
                {paying ? "Traitement en cours..." : "Payer via Mobile Money"}
              </button>

              {payResult && (
                <p className={`text-sm ${payResult.success ? "text-green-400" : "text-red-400"}`}>
                  {payResult.message}
                </p>
              )}
            </div>
          )}

          {method === "card" && (
            <p className="text-gray-400 text-sm mt-4">
              Les paiements par carte bancaire arrivent bientôt.
            </p>
          )}
        </div>

        {/* Payment History */}
        <div className="premium-card p-6 flex flex-col gap-4 mb-10">
          <h2 className="text-xl font-semibold">Historique des paiements</h2>

          {historyLoading ? (
            <p className="text-gray-400">Chargement...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun paiement enregistré.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize">{item.provider}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">
                      {item.amount} {item.currency}
                    </span>
                    <span className={`text-xs font-medium ${statusColor(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing link */}
        <div className="premium-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Comparer les plans</h2>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-accent rounded-smooth premium-hover shadow-soft w-fit"
          >
            Voir tous les plans
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto py-10 text-center text-gray-500 text-sm">
        Prestige Build © {new Date().getFullYear()}
      </div>
    </div>
  );
}
