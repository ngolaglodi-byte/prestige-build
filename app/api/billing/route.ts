import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { subscriptions } from "@/db/supabase-schema";
import { eq } from "drizzle-orm";
import { getPlan } from "@/lib/billing/plans";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) {
    const freePlan = getPlan("free");
    return NextResponse.json({
      plan: "free",
      credits: freePlan.credits,
      creditsMonthly: freePlan.credits,
      status: "active",
      renewalDate: null,
      limits: freePlan.limits,
    });
  }

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);
  const plan = getPlan(sub?.plan ?? "free");

  return NextResponse.json({
    plan: sub?.plan ?? "free",
    credits: sub?.creditsRemaining ?? plan.credits,
    creditsMonthly: sub?.creditsMonthly ?? plan.credits,
    status: sub?.status ?? "active",
    renewalDate: sub?.renewalDate ?? null,
    limits: plan.limits,
  });
}
