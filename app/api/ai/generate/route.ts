import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits } from "@/lib/credits/consumeCredits";
import { checkCredits } from "@/lib/credits/checkCredits";
import { estimateComplexity } from "@/lib/ai/complexity";
import { tokenRules } from "@/lib/ai/tokenRules";

const client = new OpenAI({ apiKey: process.env.OPENAI_KEY ?? "" });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { prompt, code, projectId } = await req.json();

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
      { error: "Not enough credits" },
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
   * 4. Appel OpenAI (CORRIGÉ : max_tokens)
   * --------------------------------------------------------- */

  const systemPrompt = `
You are a senior code generator.
  `;

  const completion = await client.chat.completions.create({
    model: "gpt-4.1",
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Current code:\n${code}` },
      { role: "user", content: `Request:\n${prompt}` },
    ],
  });

  const result = completion.choices[0].message.content ?? "";

  /* ---------------------------------------------------------
   * 5. Réponse finale
   * --------------------------------------------------------- */
  return NextResponse.json({
    result,
    complexity,
    maxTokensUsed: maxTokens,
    creditsUsed: creditCost,
  });
}
