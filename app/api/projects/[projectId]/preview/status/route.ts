import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users, previewSessions } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;

    // Resolve Clerk ID to internal user UUID
    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const user = userRows[0];
    if (!user) return new Response("User not found", { status: 404 });

    const userId = user.id;

    const previewRows = await db
      .select()
      .from(previewSessions)
      .where(
        and(
          eq(previewSessions.projectId, projectId),
          eq(previewSessions.userId, userId),
          inArray(previewSessions.status, ["running", "starting"])
        )
      )
      .limit(1);

    const preview = previewRows[0] ?? null;

    if (!preview) {
      return NextResponse.json({
        ok: true,
        status: "stopped",
        preview: null,
      });
    }

    return NextResponse.json({
      ok: true,
      status: preview.status,
      preview,
    });
  } catch (err) {
    console.error("❌ Error getting preview status:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
