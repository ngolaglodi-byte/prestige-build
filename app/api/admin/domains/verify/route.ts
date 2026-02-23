import { db } from "@/db/client";
import { domains } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const domainId = form.get("domainId") as string;

  await db
    .update(domains)
    .set({ verified: true })
    .where(eq(domains.id, domainId));

  return Response.redirect("/admin/domains");
}
