import { db } from "@/db/client";
import { users, adminAiConfig } from "@/db/schema";
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

  const form = await req.formData();
  const provider = form.get("provider") as string;
  const priority = parseInt(form.get("priority") as string, 10);
  const maxTokens = parseInt(form.get("maxTokens") as string, 10);

  if (isNaN(priority) || isNaN(maxTokens)) {
    return new Response("Invalid priority or maxTokens value", { status: 400 });
  }

  await db.insert(adminAiConfig).values({ provider, priority, maxTokens });

  return Response.redirect("/admin/ai");
}
