import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { storageBuckets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { parseBody, isFormSubmission } from "@/lib/api/parseBody";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isForm = isFormSubmission(req);

  try {
    const body = await parseBody(req);
    const projectId = body.projectId as string | undefined;

    if (!projectId) {
      if (isForm) {
        redirect("/admin/projects?error=missing_id");
      }
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    await db
      .update(storageBuckets)
      .set({ storageUsedMb: 0, dbUsedMb: 0 })
      .where(eq(storageBuckets.projectId, projectId));

    if (isForm) {
      redirect("/admin/projects");
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/projects/reset-quota] Error:", error);
    if (isForm) {
      redirect("/admin/projects?error=internal");
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
