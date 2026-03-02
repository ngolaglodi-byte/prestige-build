// app/api/figma/import/route.ts
// POST /api/figma/import — Import a Figma file and generate React/Tailwind code.

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { rateLimitAsync } from "@/lib/rate-limit";
import { apiOk, apiError } from "@/lib/api-response";
import logger from "@/lib/logger";
import { parseFigmaFile } from "@/lib/figma/parser";
import { figmaToCode } from "@/lib/figma/figmaToCode";

const RequestBody = z.object({
  figmaUrl: z.string().url("URL Figma invalide"),
  figmaToken: z.string().min(1, "Token Figma requis"),
  projectId: z.string().uuid("ID projet invalide"),
  framework: z.string().optional().default("react"),
});

/** Extract fileKey (and optional nodeIds) from a Figma file URL. */
function parseFigmaUrl(url: string): { fileKey: string; nodeIds?: string } {
  const match = url.match(/figma\.com\/(?:file|design)\/([A-Za-z0-9_-]+)/);
  if (!match) {
    throw new Error("URL Figma invalide : impossible d'extraire le fileKey");
  }
  const fileKey = match[1];
  const u = new URL(url);
  const nodeId = u.searchParams.get("node-id") ?? undefined;
  return { fileKey, nodeIds: nodeId ?? undefined };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError("Non autorisé", 401);

    const rl = await rateLimitAsync(`figma:import:${userId}`, 10, 60_000);
    if (!rl.success) return apiError("Trop de requêtes", 429);

    const body = await req.json();
    const parsed = RequestBody.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Données invalides", 422);
    }

    const { figmaUrl, figmaToken, projectId } = parsed.data;

    let fileKey: string;
    let nodeIds: string | undefined;
    try {
      ({ fileKey, nodeIds } = parseFigmaUrl(figmaUrl));
    } catch (err) {
      return apiError(err instanceof Error ? err.message : "URL invalide", 400);
    }

    const figmaApiUrl = nodeIds
      ? `https://api.figma.com/v1/files/${fileKey}?ids=${nodeIds}`
      : `https://api.figma.com/v1/files/${fileKey}`;

    logger.info({ userId, projectId, fileKey }, "Fetching Figma file");

    const figmaRes = await fetch(figmaApiUrl, {
      headers: { "X-Figma-Token": figmaToken },
    });

    if (!figmaRes.ok) {
      const errText = await figmaRes.text();
      logger.error({ status: figmaRes.status, body: errText }, "Figma API error");
      return apiError(`Erreur Figma API (${figmaRes.status})`, 502);
    }

    const figmaData = await figmaRes.json();

    const designTree = parseFigmaFile(fileKey, figmaData);
    const { files, summary } = figmaToCode(designTree);

    logger.info({ userId, projectId, fileKey, summary }, "Figma import complete");

    return apiOk({ files, summary });
  } catch (err) {
    logger.error({ err }, "Figma import unexpected error");
    const message = err instanceof Error ? err.message : "Erreur interne";
    return apiError(message, 500);
  }
}
