import { db } from "@/db/client";
import { users, storageBuckets } from "@/db/schema";
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
  const projectId = form.get("projectId") as string;

  await db
    .update(storageBuckets)
    .set({ storageUsedMb: 0, dbUsedMb: 0 })
    .where(eq(storageBuckets.projectId, projectId));

  return Response.redirect("/admin/projects");
}
