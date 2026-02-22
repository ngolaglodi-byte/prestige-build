import { db } from "@/db/client";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const subId = form.get("subId") as string;

  await db
    .update(subscriptions)
    .set({ status: "suspended" })
    .where(eq(subscriptions.id, subId));

  return Response.redirect("/admin/billing");
}
