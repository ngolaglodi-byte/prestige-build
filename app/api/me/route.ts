import { getCurrentUserWithRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUserWithRole();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("[api/me] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
