import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.currentUser.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ updated: false });

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, user.id));

  return NextResponse.json({ updated: true });
}
