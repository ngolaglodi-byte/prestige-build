import { db } from "@/db/client";
import { adminAiConfig } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const providerId = form.get("providerId") as string;

  await db
    .update(adminAiConfig)
    .set({ enabled: sql`NOT ${adminAiConfig.enabled}`, updatedAt: new Date() })
    .where(eq(adminAiConfig.id, providerId));

  return Response.redirect("/admin/ai");
}
