import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { activateUser } from "@/lib/auth/service";

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

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    const result = await activateUser(currentUser.id, userId);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/users/activate] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de l'activation de l'utilisateur" },
      { status: 500 }
    );
  }
}
