import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { integrations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ integrations: [] });

  const rows = await db
    .select()
    .from(integrations)
    .where(eq(integrations.userId, user.id));

  return NextResponse.json({ integrations: rows });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { provider, config } = await req.json();

  const validProviders = ["github", "vercel", "supabase", "webhooks"];
  if (!provider || !validProviders.includes(provider)) {
    return new Response("Invalid provider", { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, user.id), eq(integrations.provider, provider)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(integrations)
      .set({ config: config ?? {}, active: true, updatedAt: new Date() })
      .where(eq(integrations.id, existing.id))
      .returning();
    return NextResponse.json({ integration: updated });
  }

  const [created] = await db.insert(integrations).values({
    userId: user.id,
    provider,
    active: true,
    config: config ?? {},
  }).returning();

  return NextResponse.json({ integration: created });
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { provider } = await req.json();

  if (!provider) return new Response("Provider is required", { status: 400 });

  await db
    .update(integrations)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(integrations.userId, user.id), eq(integrations.provider, provider)));

  return NextResponse.json({ success: true });
}
