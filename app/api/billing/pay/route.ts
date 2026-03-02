import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, creditPurchases, billingEvents } from "@/db/schema";
import { subscriptions } from "@/db/supabase-schema";
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      { error: "Invalid plan. Options: pro, enterprise" },
      { status: 400 }
    );
  }

  if (!phoneNumber || typeof phoneNumber !== "string") {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 }
    );
  }

  // Look up the user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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

  // Record the payment attempt
  await db.insert(creditPurchases).values({
    userId: user.id,
    creditsAmount: selectedPlan.credits,
    amountPaid: localAmount,
    currency,
    provider: "pawapay",
    status: "pending",
    rawPayload: { depositId, phoneNumber, plan, country, localAmount, usdAmount: selectedPlan.priceUsd },
  });

  // Record the billing event
  await db.insert(billingEvents).values({
    userId: user.id,
    provider: "pawapay",
    amount: localAmount,
    currency,
    status: "pending",
    rawPayload: { depositId, phoneNumber, plan, country, localAmount, usdAmount: selectedPlan.priceUsd },
  });

  // Call PawaPay API (if key is configured)
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
          { error: "PawaPay error", details: data },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        depositId,
        status: "pending",
        message: "Payment initiated. Confirm on your phone.",
        plan,
        credits: selectedPlan.credits,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      return NextResponse.json(
        { error: "Unable to contact PawaPay", details: message },
        { status: 502 }
      );
    }
  }

  // Demo mode (without PawaPay key): credit directly
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
    message: "Credits added (demo mode).",
    plan,
    credits: selectedPlan.credits,
  });
}
