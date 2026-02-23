import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits } from "@/lib/credits/consumeCredits";
import { checkCredits } from "@/lib/credits/checkCredits";
import { estimateComplexity } from "@/lib/ai/complexity";
import { tokenRules } from "@/lib/ai/tokenRules";
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

  const { prompt, code, projectId, model: requestedModel } = await req.json();

  /* ---------------------------------------------------------
   * 1. Détecter la complexité
   * --------------------------------------------------------- */
  const complexity = estimateComplexity(prompt, code);
  const { maxTokens, creditCost } = tokenRules[complexity];

  /* ---------------------------------------------------------
   * 2. Vérifier crédits
   * --------------------------------------------------------- */
  const hasCredits = await checkCredits(userId, creditCost);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Crédits insuffisants" },
      { status: 402 }
    );
  }

  /* ---------------------------------------------------------
   * 3. Consommer crédits
   * --------------------------------------------------------- */
  await consumeCredits({
    userId,
    projectId: projectId ?? null,
    credits: creditCost,
    action: `ai.generate.${complexity}`,
  });

  /* ---------------------------------------------------------
   * 4. Appel IA multi-provider avec fallback et retry
   * --------------------------------------------------------- */
  const preferredModel: AIModel = requestedModel ?? provider.resolveModel("gpt");

  const systemPrompt = `You are a senior code generator. Respond only with code unless asked otherwise.`;

  const userPrompt = code
    ? `Current code:\n${code}\n\nRequest:\n${prompt}`
    : prompt;

  try {
    const { result, model: usedModel } = await provider.generateWithFallback(
      preferredModel,
      userPrompt,
      { maxTokens, systemPrompt }
    );

    /* ---------------------------------------------------------
     * 5. Réponse finale
     * --------------------------------------------------------- */
    return NextResponse.json({
      result,
      complexity,
      maxTokensUsed: maxTokens,
      creditsUsed: creditCost,
      model: usedModel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur IA inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
