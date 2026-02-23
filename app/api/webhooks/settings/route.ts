import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { webhookConfigs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ config: null });

  const [config] = await db
    .select()
    .from(webhookConfigs)
    .where(eq(webhookConfigs.userId, user.id))
    .limit(1);

  return NextResponse.json({ config: config ?? null });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { endpointUrl } = await req.json();

  if (!endpointUrl) return new Response("Endpoint URL is required", { status: 400 });

  const signingSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;

  const [existing] = await db
    .select()
    .from(webhookConfigs)
    .where(eq(webhookConfigs.userId, user.id))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(webhookConfigs)
      .set({ endpointUrl })
      .where(eq(webhookConfigs.id, existing.id))
      .returning();
    return NextResponse.json({ config: updated });
  }

  const [created] = await db.insert(webhookConfigs).values({
    userId: user.id,
    endpointUrl,
    signingSecret,
  }).returning();

  return NextResponse.json({ config: created });
}
