import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Validates a Figma access token by making a test API call.
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) as { token?: string };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const res = await fetch("https://api.figma.com/v1/me", {
      headers: { "X-Figma-Token": token },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid Figma token" }, { status: 401 });
    }

    const user = await res.json();
    return NextResponse.json({
      connected: true,
      user: { id: user.id, handle: user.handle, email: user.email },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
