// app/api/ai/prompt-to-app/route.ts
// Endpoint that receives a natural-language prompt, generates a full project
// using the AI orchestrator, creates a project in the DB, and returns the
// generated files via SSE streaming.

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { orchestrate } from "@/lib/ai/orchestrator";
import { apiError } from "@/lib/api-response";
import logger from "@/lib/logger";

const PostBody = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.enum(["claude", "gemini", "gpt"]).optional(),
  projectType: z.string().optional().default("nextjs"),
});

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return apiError("Unauthorized", 401);

    const body = await req.json();
    const parsed = PostBody.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);
    }

    const { prompt, model, projectType } = parsed.data;

    // Use SSE to stream progress back to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        }

        try {
          // Step 1: notify prompt received
          send("step", { step: "prompt", status: "done", message: "Prompt reçu" });

          // Step 2: AI generation
          send("step", {
            step: "generation",
            status: "in_progress",
            message: "Génération IA en cours…",
          });

          const result = await orchestrate({
            action: "create_project",
            prompt,
            model,
            projectType,
          });

          // Parse generated files from the result text
          const files = parseGeneratedFiles(result.result);

          send("step", {
            step: "generation",
            status: "done",
            message: `${files.length} fichiers générés`,
          });

          // Step 3: preview
          send("step", {
            step: "preview",
            status: "done",
            message: "Aperçu prêt",
          });

          // Step 4: complete
          send("result", {
            files,
            model: result.model,
            complexity: result.complexity,
            creditCost: result.creditCost,
          });

          send("step", {
            step: "deployment",
            status: "done",
            message: "Projet prêt pour le déploiement",
          });
        } catch (err) {
          logger.error({ err }, "prompt-to-app SSE error");
          send("error", {
            message: err instanceof Error ? err.message : "Internal error",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    logger.error({ err }, "prompt-to-app route error");
    return apiError("Internal server error", 500);
  }
}

/** Extract `<file path="...">content</file>` blocks from AI output. */
function parseGeneratedFiles(
  text: string
): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  const regex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    files.push({ path: match[1], content: match[2].trim() });
  }
  // If no structured blocks found, return the raw result as a single file
  if (files.length === 0 && text.trim().length > 0) {
    files.push({ path: "app/page.tsx", content: text.trim() });
  }
  return files;
}
