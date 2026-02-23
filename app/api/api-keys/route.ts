import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { apiKeys, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ keys: [] });

  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id));

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { label } = await req.json();
  const key = `sk_live_${crypto.randomBytes(24).toString("hex")}`;

  const [created] = await db.insert(apiKeys).values({
    userId: user.id,
    key,
    label: label ?? "Default",
  }).returning();

  return NextResponse.json({ key: created });
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { id } = await req.json();
  await db.delete(apiKeys).where(eq(apiKeys.id, id));

  return NextResponse.json({ deleted: true });
}
