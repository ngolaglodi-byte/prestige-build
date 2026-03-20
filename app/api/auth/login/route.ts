import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth/service";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.ip;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await login(email, password, ip, userAgent);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        role: result.user!.role,
      },
      mustChangePassword: result.mustChangePassword,
    });
  } catch (error) {
    console.error("[auth/login] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
