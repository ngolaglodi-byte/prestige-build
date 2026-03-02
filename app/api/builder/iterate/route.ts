import { NextRequest, NextResponse } from "next/server";
import { iterateOnCode } from "@/lib/builder/ai-engine";
import { mergeFiles } from "@/lib/builder/code-generator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, files, history } = body as {
      message?: string;
      files?: { path: string; content: string }[];
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "files array is required" }, { status: 400 });
    }

    const result = await iterateOnCode(message, files, history ?? []);
    const merged = mergeFiles(files, result.files);

    return NextResponse.json({
      files: merged,
      changes: result.files,
      raw: result.rawResponse,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
