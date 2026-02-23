import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
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
