import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { resetUserPassword } from "@/lib/auth/service";

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    const { userId, newPassword } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    const result = await resetUserPassword(currentUser.id, userId, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      tempPassword: result.tempPassword,
    });
  } catch (error) {
    console.error("[admin/users/reset-password] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la réinitialisation du mot de passe" },
      { status: 500 }
    );
  }
}
