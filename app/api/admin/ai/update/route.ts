import { db } from "@/db/client";
import { adminAiConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const providerId = form.get("providerId") as string;
  const priority = parseInt(form.get("priority") as string, 10);
  const maxTokens = parseInt(form.get("maxTokens") as string, 10);

  await db
    .update(adminAiConfig)
    .set({ priority, maxTokens, updatedAt: new Date() })
    .where(eq(adminAiConfig.id, providerId));

  return Response.redirect("/admin/ai");
}
