import { db } from "@/db/client";
import { users, adminPricingConfig } from "@/db/schema";
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
  const key = form.get("key") as string;
  const rawValue = form.get("value") as string;

  let value: unknown;
  try {
    value = JSON.parse(rawValue);
  } catch {
    return new Response("Invalid JSON value", { status: 400 });
  }

  const existing = await db
    .select()
    .from(adminPricingConfig)
    .where(eq(adminPricingConfig.key, key))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(adminPricingConfig)
      .set({ value, updatedAt: new Date() })
      .where(eq(adminPricingConfig.key, key));
  } else {
    await db.insert(adminPricingConfig).values({ key, value });
  }

  return Response.redirect(new URL("/admin/pricing", req.url));
}
