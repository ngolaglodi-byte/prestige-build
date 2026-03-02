import { NextRequest, NextResponse } from "next/server";
import { generateFromPrompt } from "@/lib/builder/ai-engine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body as {
      message?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const result = await generateFromPrompt(message, history ?? []);

    return NextResponse.json({
      files: result.files,
      raw: result.rawResponse,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
