import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { consumeCredits } from "@/lib/credits/consumeCredits";
import { checkCredits } from "@/lib/credits/checkCredits";
import { estimateComplexity } from "@/lib/ai/complexity";
import { tokenRules } from "@/lib/ai/tokenRules";
import { AIProvider, type AIModel } from "@/lib/ai/provider";
import { checkAIGenerationLimit } from "@/lib/usage/trackUsage";

const provider = new AIProvider();

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const available = provider.getAvailableModels();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "No AI provider configured" },
      { status: 503 }
    );
  }

  const { prompt, code, projectId, model: requestedModel } = await req.json();

  /* ---------------------------------------------------------
   * 1. Detect complexity
   * --------------------------------------------------------- */
  const complexity = estimateComplexity(prompt, code);
  const { maxTokens, creditCost } = tokenRules[complexity];

  /* ---------------------------------------------------------
   * 1b. Check AI generation limit for the plan
   * --------------------------------------------------------- */
  const genLimit = await checkAIGenerationLimit(userId);
  if (!genLimit.allowed) {
    return NextResponse.json(
      {
        error: `AI generation limit reached (${genLimit.used}/${genLimit.limit} this month)`,
      },
      { status: 429 }
    );
  }

  /* ---------------------------------------------------------
   * 2. Check credits
   * --------------------------------------------------------- */
  const hasCredits = await checkCredits(userId, creditCost);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits" },
      { status: 402 }
    );
  }

  /* ---------------------------------------------------------
   * 3. Consume credits
   * --------------------------------------------------------- */
  await consumeCredits({
    userId,
    projectId: projectId ?? null,
    credits: creditCost,
    action: `ai.generate.${complexity}`,
  });

  /* ---------------------------------------------------------
   * 4. AI call with multi-provider fallback and retry
   * --------------------------------------------------------- */
  const preferredModel: AIModel = requestedModel ?? provider.resolveModel("gpt");

  const systemPrompt = [
    "Tu es un générateur de code senior expert, intégré à la plateforme Prestige Build.",
    "Tu maîtrises tous les langages et frameworks modernes : TypeScript, JavaScript, Python, Go, Swift, Kotlin, Rust, etc.",
    "Réponds uniquement avec du code propre, bien structuré et prêt pour la production, sauf si l'utilisateur demande une explication.",
    "Toutes tes réponses sont en français.",
    "Utilise les bonnes pratiques : typage TypeScript strict, composants React fonctionnels, gestion d'erreurs, accessibilité.",
    "Ajoute des commentaires concis en français uniquement quand la logique est complexe.",
    "Si la demande est ambiguë, génère la solution la plus probable et ajoute un bref commentaire expliquant ton choix.",
    "Ne répète jamais le code existant inutilement — fournis uniquement les modifications ou ajouts nécessaires.",
    "N'invente jamais de chemins de fichiers qui n'existent pas dans le projet.",
    "Ne génère pas de fichiers invalides ou incomplets.",
  ].join("\n");

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
     * 5. Final response
     * --------------------------------------------------------- */
    return NextResponse.json({
      result,
      complexity,
      maxTokensUsed: maxTokens,
      creditsUsed: creditCost,
      model: usedModel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
