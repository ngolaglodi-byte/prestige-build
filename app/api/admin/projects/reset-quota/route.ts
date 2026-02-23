import { db } from "@/db/client";
import { storageBuckets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const projectId = form.get("projectId") as string;

  await db
    .update(storageBuckets)
    .set({ storageUsedMb: 0, dbUsedMb: 0 })
    .where(eq(storageBuckets.projectId, projectId));

  return Response.redirect("/admin/projects");
}
