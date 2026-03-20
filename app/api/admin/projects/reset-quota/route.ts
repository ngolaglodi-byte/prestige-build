import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { storageBuckets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    await db
      .update(storageBuckets)
      .set({ storageUsedMb: 0, dbUsedMb: 0 })
      .where(eq(storageBuckets.projectId, projectId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/projects/reset-quota] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
