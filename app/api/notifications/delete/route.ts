import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return NextResponse.json({ deleted: false });

  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  return NextResponse.json({ deleted: true });
}
