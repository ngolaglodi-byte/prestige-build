import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, creditPurchases, subscriptions, billingEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import {
  currencyForCountry,
  fetchFxRates,
  convertPrice,
  PAWAPAY_CORRESPONDENTS,
  type CurrencyCode,
} from "@/lib/billing/pricing";

const PAWAPAY_API_URL = process.env.PAWAPAY_API_URL ?? "https://api.pawapay.io";
const PAWAPAY_API_KEY = process.env.PAWAPAY_API_KEY;

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { plan, phoneNumber, currency: rawCurrency, country: rawCountry } = await req.json();

  // Resolve country → currency → converted amount
  const DEFAULT_COUNTRY = "CD";
  const country = (typeof rawCountry === "string" ? rawCountry : DEFAULT_COUNTRY).toUpperCase();
  const currency: CurrencyCode = (typeof rawCurrency === "string" && rawCurrency.length === 3)
    ? rawCurrency.toUpperCase() as CurrencyCode
    : currencyForCountry(country);

  const selectedPlan = PLANS[plan as PlanId];
  if (!selectedPlan || plan === "free") {
    return NextResponse.json(
      { error: "Plan invalide. Options : pro, enterprise" },
      { status: 400 }
    );
  }

  if (!phoneNumber || typeof phoneNumber !== "string") {
    return NextResponse.json(
      { error: "Numéro de téléphone requis" },
      { status: 400 }
    );
  }

  // Récupérer l'utilisateur
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const depositId = crypto.randomUUID();

  // Compute local amount
  const rates = await fetchFxRates();
  const localAmount = convertPrice(selectedPlan.priceUsd, currency, rates);

  // Resolve PawaPay correspondent
  const correspondent =
    PAWAPAY_CORRESPONDENTS[country] ??
    process.env.PAWAPAY_CORRESPONDENT ??
    "MTN_MOMO_COD";

  // Enregistrer la tentative de paiement
  await db.insert(creditPurchases).values({
    userId: user.id,
    creditsAmount: selectedPlan.credits,
    amountPaid: localAmount,
    currency,
    provider: "pawapay",
    status: "pending",
    rawPayload: { depositId, phoneNumber, plan, country, localAmount, usdAmount: selectedPlan.priceUsd },
  });

  // Enregistrer l'événement de billing
  await db.insert(billingEvents).values({
    userId: user.id,
    provider: "pawapay",
    amount: localAmount,
    currency,
    status: "pending",
    rawPayload: { depositId, phoneNumber, plan, country, localAmount, usdAmount: selectedPlan.priceUsd },
  });

  // Appel PawaPay API (si clé configurée)
  if (PAWAPAY_API_KEY) {
    try {
      const response = await fetch(`${PAWAPAY_API_URL}/deposits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PAWAPAY_API_KEY}`,
        },
        body: JSON.stringify({
          depositId,
          amount: String(localAmount),
          currency,
          correspondent,
          payer: {
            type: "MSISDN",
            address: { value: phoneNumber.replace(/\s/g, "") },
          },
          statementDescription: `Prestige Build ${plan}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: "Erreur PawaPay", details: data },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        depositId,
        status: "pending",
        message: "Paiement initié. Confirmez sur votre téléphone.",
        plan,
        credits: selectedPlan.credits,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur réseau";
      return NextResponse.json(
        { error: "Impossible de contacter PawaPay", details: message },
        { status: 502 }
      );
    }
  }

  // Mode démo (sans clé PawaPay) : créditer directement
  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  if (existingSub) {
    await db
      .update(subscriptions)
      .set({
        plan,
        creditsRemaining: sql`${subscriptions.creditsRemaining} + ${selectedPlan.credits}`,
        creditsMonthly: selectedPlan.credits,
        storageLimitMb: selectedPlan.limits.workspaceSizeMb,
        priceUsd: selectedPlan.priceUsd,
      })
      .where(eq(subscriptions.userId, user.id));
  } else {
    await db.insert(subscriptions).values({
      userId: user.id,
      plan,
      creditsMonthly: selectedPlan.credits,
      creditsRemaining: selectedPlan.credits,
      storageLimitMb: selectedPlan.limits.workspaceSizeMb,
      dbLimitMb: 100,
      priceUsd: selectedPlan.priceUsd,
      status: "active",
    });
  }

  return NextResponse.json({
    success: true,
    depositId,
    status: "completed",
    message: "Crédits ajoutés (mode démo).",
    plan,
    credits: selectedPlan.credits,
  });
}
