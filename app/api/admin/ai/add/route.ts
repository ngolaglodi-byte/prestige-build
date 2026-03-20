import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { adminAiConfig } from "@/db/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { provider, priority, maxTokens } = body;

    if (!provider || typeof priority !== "number" || typeof maxTokens !== "number") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await db.insert(adminAiConfig).values({ provider, priority, maxTokens });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/ai/add] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
