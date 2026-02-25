import { db } from "@/db/client";
import { users, adminAiConfig } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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

  const form = await req.formData();
  const providerId = form.get("providerId") as string;

  await db
    .update(adminAiConfig)
    .set({ enabled: sql`NOT ${adminAiConfig.enabled}`, updatedAt: new Date() })
    .where(eq(adminAiConfig.id, providerId));

  return Response.redirect(new URL("/admin/ai", req.url));
}
