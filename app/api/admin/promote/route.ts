import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const targetUserId = body.userId;
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const result = await db
      .update(users)
      .set({ role: "ADMIN" })
      .where(eq(users.id, targetUserId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: result[0] });
  } catch (error) {
    console.error("[admin/promote] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
