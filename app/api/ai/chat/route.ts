// app/api/ai/chat/route.ts
// POST /api/ai/chat — Streaming AI chat with SSE.

import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";
import OpenAI from "openai";
import { rateLimitAsync } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-response";
import logger from "@/lib/logger";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const RequestBody = z.object({
  messages: z.array(MessageSchema).min(1),
  projectId: z.string().optional(),
  context: z.string().optional(),
});

const SYSTEM_PROMPT = `Tu es Prestige Build Assistant, un expert en développement web moderne.
Tu aides les développeurs à construire des applications React/TypeScript/Tailwind CSS.
Réponds toujours en français de manière conversationnelle et amicale.
Quand tu génères du code, encadre chaque fichier avec des blocs de code incluant le chemin :
\`\`\`tsx path="components/MonComposant.tsx"
// code ici
\`\`\`
Utilise TypeScript strict, des composants React fonctionnels, Tailwind CSS pour les styles.
Ajoute des commentaires concis en français pour la logique complexe.
Sois précis, direct et pédagogique.`;

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return apiError("Unauthorized", 401);

    const rl = await rateLimitAsync(`chat:${userId}`, 30, 60_000);
    if (!rl.success) return apiError("Too many requests", 429);

    const body = await req.json();
    const parsed = RequestBody.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Données invalides", 422);
    }

    const { messages, context } = parsed.data;

    const systemMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (context) {
      systemMessages.push({
        role: "system",
        content: `Contexte du projet actuel :\n${context}`,
      });
    }

    const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...systemMessages,
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    logger.info({ userId, messageCount: messages.length }, "AI chat request");

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: allMessages,
      stream: true,
      max_tokens: 4096,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              const data = `data: ${JSON.stringify({ text })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          logger.error({ err }, "AI chat stream error");
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Streaming error" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    logger.error({ err }, "AI chat unexpected error");
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}
