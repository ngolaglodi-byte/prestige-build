import { db } from "@/db/client";
import { users, domains } from "@/db/schema";
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
  const domainId = form.get("domainId") as string;

  // Simulates SSL regeneration — in production this would trigger actual SSL cert provisioning
  await db
    .update(domains)
    .set({ verified: true })
    .where(eq(domains.id, domainId));

  return Response.redirect(new URL("/admin/domains", req.url));
}
