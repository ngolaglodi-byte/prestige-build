import { NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  creditPurchases,
  subscriptions,
  billingEvents,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getPlan } from "@/lib/billing/plans";

const PAWAPAY_WEBHOOK_SECRET = process.env.PAWAPAY_WEBHOOK_SECRET;

/**
 * PawaPay Webhook — gère les callbacks de paiement :
 * - COMPLETED  → paiement réussi
 * - FAILED     → paiement échoué
 * - RENEWAL    → renouvellement d'abonnement
 */
export async function POST(req: Request) {
  // Vérifier le secret webhook si configuré
  if (PAWAPAY_WEBHOOK_SECRET) {
    const signature = req.headers.get("x-pawapay-signature") ?? "";
    if (signature !== PAWAPAY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Signature invalide" },
        { status: 401 }
      );
    }
  }

  const body = await req.json();
  const { depositId, status, amount, currency } = body;

  if (!depositId || !status) {
    return NextResponse.json(
      { error: "Données manquantes" },
      { status: 400 }
    );
  }

  // Trouver l'achat en attente
  const [purchase] = await db
    .select()
    .from(creditPurchases)
    .where(eq(creditPurchases.status, "pending"))
    .limit(1);

  if (!purchase) {
    return NextResponse.json(
      { error: "Achat introuvable" },
      { status: 404 }
    );
  }

  const rawPayload = purchase.rawPayload as Record<string, string> | null;
  const planId = rawPayload?.plan ?? "free";
  const plan = getPlan(planId);

  if (status === "COMPLETED") {
    // Mettre à jour l'achat
    await db
      .update(creditPurchases)
      .set({ status: "completed", rawPayload: body })
      .where(eq(creditPurchases.id, purchase.id));

    // Mettre à jour ou créer l'abonnement
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, purchase.userId))
      .limit(1);

    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    if (existingSub) {
      await db
        .update(subscriptions)
        .set({
          plan: planId,
          creditsRemaining: sql`${subscriptions.creditsRemaining} + ${plan.credits}`,
          creditsMonthly: plan.credits,
          storageLimitMb: plan.limits.workspaceSizeMb,
          priceUsd: plan.priceUsd,
          status: "active",
          renewalDate,
        })
        .where(eq(subscriptions.userId, purchase.userId));
    } else {
      await db.insert(subscriptions).values({
        userId: purchase.userId,
        plan: planId,
        creditsMonthly: plan.credits,
        creditsRemaining: plan.credits,
        storageLimitMb: plan.limits.workspaceSizeMb,
        dbLimitMb: 100,
        priceUsd: plan.priceUsd,
        status: "active",
        renewalDate,
      });
    }

    // Événement de billing
    await db.insert(billingEvents).values({
      userId: purchase.userId,
      provider: "pawapay",
      amount: amount ?? plan.priceUsd,
      currency: currency ?? "USD",
      status: "completed",
      rawPayload: body,
    });

    return NextResponse.json({ success: true, message: "Paiement confirmé" });
  }

  if (status === "FAILED") {
    await db
      .update(creditPurchases)
      .set({ status: "failed", rawPayload: body })
      .where(eq(creditPurchases.id, purchase.id));

    await db.insert(billingEvents).values({
      userId: purchase.userId,
      provider: "pawapay",
      amount: amount ?? plan.priceUsd,
      currency: currency ?? "USD",
      status: "failed",
      rawPayload: body,
    });

    return NextResponse.json({ success: true, message: "Échec enregistré" });
  }

  if (status === "RENEWAL") {
    // Renouvellement d'abonnement
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, purchase.userId))
      .limit(1);

    if (existingSub) {
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      await db
        .update(subscriptions)
        .set({
          creditsRemaining: plan.credits,
          status: "active",
          renewalDate,
        })
        .where(eq(subscriptions.userId, purchase.userId));
    }

    await db.insert(billingEvents).values({
      userId: purchase.userId,
      provider: "pawapay",
      amount: amount ?? plan.priceUsd,
      currency: currency ?? "USD",
      status: "renewed",
      rawPayload: body,
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement renouvelé",
    });
  }

  return NextResponse.json(
    { error: "Statut non supporté" },
    { status: 400 }
  );
}
