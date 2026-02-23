import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { subscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ plan: "free", credits: 0 });

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);

  return NextResponse.json({
    plan: sub?.plan ?? "free",
    credits: sub?.creditsRemaining ?? 0,
    creditsMonthly: sub?.creditsMonthly ?? 0,
    status: sub?.status ?? "active",
    renewalDate: sub?.renewalDate ?? null,
  });
}
