import { db } from "@/db/client";
import { activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const logId = form.get("logId") as string;

  await db.delete(activityLogs).where(eq(activityLogs.id, logId));

  return Response.redirect("/admin/logs");
}
