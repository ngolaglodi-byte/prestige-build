import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId: adminClerkId } = await auth();
    if (!adminClerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [admin] = await db.select().from(users).where(eq(users.clerkId, adminClerkId));
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const clerkId = body.clerkId;
    if (!clerkId || typeof clerkId !== "string") {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }

    const result = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.clerkId, clerkId))
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
