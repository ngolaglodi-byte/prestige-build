import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createInitialAdmin } from "@/lib/auth/service";

export async function GET() {
  try {
    // Check if any users exist
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .limit(1);

    return NextResponse.json({
      ok: true,
      hasUsers: !!existingUser,
    });
  } catch (error) {
    console.error("[auth/setup] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { ok: false, error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const result = await createInitialAdmin(email, password, name);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      userId: result.userId,
    });
  } catch (error) {
    console.error("[auth/setup] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
