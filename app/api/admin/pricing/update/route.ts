import { db } from "@/db/client";
import { adminPricingConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const key = form.get("key") as string;
  const value = JSON.parse(form.get("value") as string);

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

  return Response.redirect("/admin/pricing");
}
