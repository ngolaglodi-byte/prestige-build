import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return NextResponse.json({ updated: false });

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, user.id));

  return NextResponse.json({ updated: true });
}
