import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { notifications, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ notifications: [] });

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(sql`${notifications.createdAt} DESC`)
    .limit(50);

  return NextResponse.json({ notifications: items });
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const { id } = await req.json();

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id));

  return NextResponse.json({ updated: true });
}
