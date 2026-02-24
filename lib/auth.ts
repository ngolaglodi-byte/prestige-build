import { auth } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/lib/ensure-user";

export async function getCurrentUserId(): Promise<string> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await ensureUserExists(clerkId);
  return user.id;
}

export async function getCurrentUserWithRole(): Promise<{
  id: string;
  clerkId: string;
  role: string;
} | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await ensureUserExists(clerkId);
  return { id: user.id, clerkId, role: user.role };
}
