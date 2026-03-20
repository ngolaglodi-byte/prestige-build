import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AIProvider, type AIModel } from "@/lib/ai/provider";

const provider = new AIProvider();

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const available = provider.getAvailableModels();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "No AI provider configured" },
      { status: 503 }
    );
  }

  const { projectId, error, fileContent } = await req.json();

  if (!error?.message || !fileContent) {
    return NextResponse.json(
      { error: "Missing parameters: error.message and fileContent are required" },
      { status: 400 }
    );
  }

  const systemPrompt =
    "You are a code debugger. The user's code has an error. Fix ONLY the error. Return the complete corrected file content. Do not add explanations.";

  const userPrompt = [
    `Error: ${error.message}`,
    error.stack ? `Stack trace:\n${error.stack}` : "",
    error.file ? `File: ${error.file}` : "",
    error.line != null ? `Line: ${error.line}` : "",
    error.column != null ? `Column: ${error.column}` : "",
    `\nFile content:\n\`\`\`\n${fileContent}\n\`\`\``,
  ]
    .filter(Boolean)
    .join("\n");

  const preferredModel: AIModel = provider.resolveModel("gpt");

  try {
    const { result } = await provider.generateWithFallback(
      preferredModel,
      userPrompt,
      { systemPrompt, maxTokens: 4000 }
    );

    // Extract code from markdown fences if present
    const codeMatch = result.match(/```[\w]*\n([\s\S]*?)```/);
    const fixedContent = codeMatch ? codeMatch[1].trim() : result.trim();

    return NextResponse.json({
      fixedContent,
      explanation: `Correction automatique de l'erreur : ${error.message}`,
      projectId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
