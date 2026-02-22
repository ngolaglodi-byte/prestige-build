import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const form = await req.formData();
  const projectId = form.get("projectId") as string;

  await db.delete(projects).where(eq(projects.id, projectId));

  return Response.redirect("/admin/projects");
}
