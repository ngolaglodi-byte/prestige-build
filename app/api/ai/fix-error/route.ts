import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AIProvider, type AIModel } from "@/lib/ai/provider";

const provider = new AIProvider();

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const available = provider.getAvailableModels();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "Aucun fournisseur IA configuré" },
      { status: 503 }
    );
  }

  const { projectId, error, fileContent } = await req.json();

  if (!error?.message || !fileContent) {
    return NextResponse.json(
      { error: "Paramètres manquants : error.message et fileContent sont requis" },
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
    const message = err instanceof Error ? err.message : "Erreur IA inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
