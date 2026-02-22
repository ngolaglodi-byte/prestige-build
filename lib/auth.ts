import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * Extracts the current Clerk userId from the request context.
 * Returns null if the user is not authenticated.
 */
export async function getCurrentUserId(_req?: NextRequest): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
