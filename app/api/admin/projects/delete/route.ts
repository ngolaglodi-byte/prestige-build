import { db } from "@/db/client";
import { projects, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId: adminClerkId } = await auth();
  if (!adminClerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [admin] = await db.select().from(users).where(eq(users.clerkId, adminClerkId));
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const projectId = form.get("projectId") as string;

  await db.delete(projects).where(eq(projects.id, projectId));

  return Response.redirect(new URL("/admin/projects", req.url));
}
