import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { estimateComplexity } from "@/lib/ai/complexity";
import { tokenRules } from "@/lib/ai/tokenRules";
import { AIProvider, type AIModel } from "@/lib/ai/provider";

const provider = new AIProvider();

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const available = provider.getAvailableModels();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "No AI provider configured" },
      { status: 503 }
    );
  }

  const { prompt, code, model: requestedModel } = await req.json();

  /* ---------------------------------------------------------
   * 1. Detect complexity
   * --------------------------------------------------------- */
  const complexity = estimateComplexity(prompt, code);
  const { maxTokens } = tokenRules[complexity];

  /* ---------------------------------------------------------
   * 2. AI call with multi-provider fallback and retry
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
      model: usedModel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
