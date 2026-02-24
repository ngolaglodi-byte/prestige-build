import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUserId(): Promise<string> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId));

  if (!user) throw new Error("User not found");
  return user.id;
}

export async function getCurrentUserWithRole(): Promise<{
  id: string;
  clerkId: string;
  role: string;
} | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const [user] = await db
    .select({ id: users.id, clerkId: users.clerkId, role: users.role })
    .from(users)
    .where(eq(users.clerkId, clerkId));

  return user ?? null;
}
