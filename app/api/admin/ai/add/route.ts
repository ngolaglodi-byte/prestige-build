import { db } from "@/db/client";
import { adminAiConfig } from "@/db/schema";

export async function POST(req: Request) {
  const form = await req.formData();
  const provider = form.get("provider") as string;
  const priority = parseInt(form.get("priority") as string, 10);
  const maxTokens = parseInt(form.get("maxTokens") as string, 10);

  await db.insert(adminAiConfig).values({ provider, priority, maxTokens });

  return Response.redirect("/admin/ai");
}
