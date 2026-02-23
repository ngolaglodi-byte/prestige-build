import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { billingEvents, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ history: [] });
  }

  const history = await db
    .select()
    .from(billingEvents)
    .where(eq(billingEvents.userId, user.id))
    .orderBy(desc(billingEvents.createdAt))
    .limit(50);

  return NextResponse.json({ history });
}
