import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId: adminClerkId } = await auth();
  if (!adminClerkId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [admin] = await db.select().from(users).where(eq(users.clerkId, adminClerkId));
  if (!admin || admin.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const clerkId = body.clerkId;
  if (!clerkId || typeof clerkId !== "string") {
    return new Response("Missing clerkId", { status: 400 });
  }

  const result = await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.clerkId, clerkId))
    .returning();

  if (result.length === 0) {
    return new Response("User not found", { status: 404 });
  }

  return Response.json({ success: true, user: result[0] });
}
