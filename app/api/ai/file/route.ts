import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits } from "@/lib/credits/consumeCredits";
import { checkCredits } from "@/lib/credits/checkCredits";
import {
  readProjectFileContent,
  writeSingleFile,
} from "@/lib/projects/fileSystem";
import { AIProvider, type AIModel } from "@/lib/ai/provider";
import { validatePath } from "@/lib/ai/safetyValidator";

const provider = new AIProvider();

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const available = provider.getAvailableModels();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "Aucun fournisseur IA configuré" },
      { status: 503 }
    );
  }

  const { projectId, filePath, instructions, model: requestedModel } = await req.json();

  if (!projectId || !filePath || !instructions) {
    return NextResponse.json(
      { error: "projectId, filePath et instructions sont requis" },
      { status: 400 }
    );
  }

  // Validation de sécurité du chemin
  const pathErrors = validatePath(filePath);
  if (pathErrors.length > 0) {
    return NextResponse.json(
      { error: `Chemin invalide : ${pathErrors.join(", ")}` },
      { status: 400 }
    );
  }

  const CREDITS_COST = 5;

  const hasCredits = await checkCredits(userId, CREDITS_COST);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Crédits insuffisants" },
      { status: 402 }
    );
  }

  const currentContent =
    readProjectFileContent(projectId, filePath) ?? "";

  await consumeCredits({
    userId,
    projectId,
    credits: CREDITS_COST,
    action: "ai.file.edit",
  });

  const systemPrompt = [
    "Tu es un éditeur de code senior.",
    "Tu reçois le contenu actuel d'un fichier et des instructions de modification.",
    "Tu DOIS retourner UNIQUEMENT le nouveau contenu complet du fichier.",
    "N'explique pas, n'encadre pas avec des backticks, retourne uniquement le code brut.",
    "Toutes tes réponses sont en français si des commentaires sont nécessaires.",
  ].join("\n");

  const userPrompt = `Chemin du fichier : ${filePath}

Contenu actuel :
${currentContent}

Instructions :
${instructions}`;

  const preferredModel: AIModel = requestedModel ?? provider.resolveModel("gpt");

  try {
    const { result: newContent, model: usedModel } = await provider.generateWithFallback(
      preferredModel,
      userPrompt,
      { maxTokens: 65000, systemPrompt }
    );

    writeSingleFile(projectId, filePath, newContent);

    return NextResponse.json({
      success: true,
      projectId,
      filePath,
      creditsUsed: CREDITS_COST,
      model: usedModel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur IA inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
