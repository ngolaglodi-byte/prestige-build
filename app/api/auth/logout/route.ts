import { NextResponse } from "next/server";
import { logout, getSession, logAudit } from "@/lib/auth/session";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await logAudit("logout", session.userId, null, {});
    }
    await logout();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth/logout] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la déconnexion" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Support GET requests for simple logout links
  return POST();
}
