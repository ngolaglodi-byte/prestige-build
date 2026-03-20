import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { changePassword } from "@/lib/auth/service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, error: "Mot de passe actuel et nouveau mot de passe requis" },
        { status: 400 }
      );
    }

    const result = await changePassword(user.id, currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
}
