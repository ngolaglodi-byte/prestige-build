import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { apiKeys, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ keys: [] });

  const keys = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      label: apiKeys.label,
      revoked: apiKeys.revoked,
      rateLimit: apiKeys.rateLimit,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id));

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { label } = await req.json();
  const rawKey = `sk_live_${crypto.randomBytes(24).toString("hex")}`;
  const keyH = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);

  const [created] = await db
    .insert(apiKeys)
    .values({
      userId: user.id,
      keyHash: keyH,
      keyPrefix,
      label: label ?? "Default",
    })
    .returning();

  return NextResponse.json({ key: { ...created, rawKey } });
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { id } = await req.json();

  await db
    .update(apiKeys)
    .set({ revoked: true })
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)));

  return NextResponse.json({ revoked: true });
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { id } = await req.json();
  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.id)));

  return NextResponse.json({ deleted: true });
}
