"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, ArrowUpCircle } from "lucide-react";

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
    <div className="p-6 lg:p-10 max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Facturation</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Gérez votre abonnement, vos paiements et votre utilisation.
        </p>
      </div>

      {/* Current plan */}
      <div className="premium-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Plan actuel</h2>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Chargement...</p>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">
              Vous êtes sur le <span className="text-accent capitalize font-medium">Plan {plan === "free" ? "Gratuit" : plan}</span>.
            </p>
            <p className="text-gray-400 text-sm">
              Crédits : <span className="text-white font-semibold">{credits}</span> / {creditsMonthly}
            </p>
            {limits && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="bg-surface rounded-smooth p-3 text-center">
                  <p className="text-xs text-gray-500">Générations IA</p>
                  <p className="font-semibold text-sm">{limits.aiGenerations}/mois</p>
                </div>
                <div className="bg-surface rounded-smooth p-3 text-center">
                  <p className="text-xs text-gray-500">Stockage</p>
                  <p className="font-semibold text-sm">{limits.workspaceSizeMb >= 1000 ? `${limits.workspaceSizeMb / 1000} Go` : `${limits.workspaceSizeMb} Mo`}</p>
                </div>
                <div className="bg-surface rounded-smooth p-3 text-center">
                  <p className="text-xs text-gray-500">Projets</p>
                  <p className="font-semibold text-sm">{limits.maxProjects === -1 ? "∞" : limits.maxProjects}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade */}
      <div className="premium-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <ArrowUpCircle className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Mettre à niveau</h2>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setMethod("mobile")}
            className={`px-4 py-2 rounded-smooth border text-sm transition-all ${
              method === "mobile"
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface text-gray-400 hover:text-white"
            }`}
          >
            Mobile Money
          </button>
          <button
            onClick={() => setMethod("card")}
            className={`px-4 py-2 rounded-smooth border text-sm transition-all ${
              method === "card"
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface text-gray-400 hover:text-white"
            }`}
          >
            Carte bancaire
          </button>
        </div>

        {method === "mobile" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Numéro Mobile Money</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 970 000 000"
                className="w-full bg-surface border border-border rounded-smooth px-4 py-2 text-sm focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Choisir un plan</label>
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`p-3 rounded-smooth border text-left text-sm transition-all ${
                      selectedPlan === p.id
                        ? "border-accent bg-accent/15"
                        : "border-border bg-surface hover:border-gray-600"
                    }`}
                  >
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.credits} crédits</div>
                    <div className="text-accent text-xs mt-1">
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
              className="px-5 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth text-sm font-medium transition-all disabled:opacity-50"
            >
              {paying ? "Traitement…" : "Payer via Mobile Money"}
            </button>

            {payResult && (
              <p className={`text-sm ${payResult.success ? "text-green-400" : "text-red-400"}`}>
                {payResult.message}
              </p>
            )}
          </div>
        )}

        {method === "card" && (
          <p className="text-gray-400 text-sm">
            Les paiements par carte bancaire arrivent bientôt.
          </p>
        )}
      </div>

      {/* Payment history */}
      <div className="premium-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Historique</h2>
        </div>

        {historyLoading ? (
          <p className="text-gray-400 text-sm">Chargement...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun paiement enregistré.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-border/50 pb-3">
                <div>
                  <span className="text-sm font-medium capitalize">{item.provider}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{item.amount} {item.currency}</span>
                  <span className={`text-xs font-medium ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compare plans */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold mb-3">Comparer les plans</h2>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accentDark text-white rounded-smooth text-sm font-medium transition-all"
        >
          Voir tous les plans
        </Link>
      </div>
    </div>
  );
}
