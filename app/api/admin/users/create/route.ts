import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createAgent } from "@/lib/auth/service";

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

    const { email, name, tempPassword } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { ok: false, error: "Email et nom requis" },
        { status: 400 }
      );
    }

    const result = await createAgent(currentUser.id, email, name, tempPassword);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      userId: result.userId,
      tempPassword: result.tempPassword,
    });
  } catch (error) {
    console.error("[admin/users/create] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
