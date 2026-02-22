import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function getCurrentUserId(req: NextRequest): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
