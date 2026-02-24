import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, files } from "@/db/schema";
import { projects } from "@/db/supabase-schema";
import { eq, and } from "drizzle-orm";
import { orchestrate, type OrchestrationAction } from "@/lib/ai/orchestrator";
import { consumeCredits } from "@/lib/credits/consumeCredits";
import { checkCredits } from "@/lib/credits/checkCredits";
import { checkAIGenerationLimit } from "@/lib/usage/trackUsage";
import { validateActions, type FileAction } from "@/lib/ai/safetyValidator";

/**
 * Détecte l'action d'orchestration à partir du prompt utilisateur.
 */
function detectAction(prompt: string): OrchestrationAction {
  const lower = prompt.toLowerCase();
  if (lower.includes("refactor")) return "refactor";
  if (lower.includes("expliqu") || lower.includes("explain")) return "explain";
  if (lower.includes("corrig") || lower.includes("fix") || lower.includes("erreur"))
    return "fix";
  if (lower.includes("multi") || lower.includes("plusieurs") || lower.includes("structure"))
    return "generate_multi";
  return "generate";
}

/**
 * Extrait les fichiers générés du format <file path="...">contenu</file>.
 */
function parseGeneratedFiles(
  raw: string
): { path: string; content: string }[] {
  const generatedFiles: { path: string; content: string }[] = [];
  const regex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    generatedFiles.push({ path: match[1], content: match[2].trim() });
  }
  return generatedFiles;
}

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Non autorisé", { status: 401 });

    const { projectId } = await params;
    const body = await req.json();
    const { prompt, filePath, code, model } = body;

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Le prompt est requis." },
        { status: 400 }
      );
    }

    // Resolve Clerk ID to internal user UUID
    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const user = userRows[0];
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userId = user.id;

    // Vérifier que le projet existe et appartient à l'utilisateur
    const projectRows = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    const project = projectRows[0];

    if (!project || project.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: "Projet non trouvé." },
        { status: 403 }
      );
    }

    // Vérifier la limite de générations IA
    const genLimit = await checkAIGenerationLimit(userId);
    if (!genLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: `Limite de générations IA atteinte (${genLimit.used}/${genLimit.limit} ce mois-ci).`,
        },
        { status: 429 }
      );
    }

    // Récupérer la liste des fichiers du projet pour le contexte
    const projectFiles = await db
      .select({ path: files.path })
      .from(files)
      .where(eq(files.projectId, projectId));

    const filePaths = projectFiles.map((f) => f.path);

    // Détecter l'action
    const action = detectAction(prompt);

    // Récupérer le contenu du fichier actif si filePath est fourni
    let fileContent = code;
    if (filePath && !fileContent) {
      const fileRows = await db
        .select()
        .from(files)
        .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
        .limit(1);
      fileContent = fileRows[0]?.content ?? undefined;
    }

    // Orchestration IA
    const result = await orchestrate({
      action,
      prompt,
      code: fileContent,
      filePath,
      projectFiles: filePaths,
      model,
    });

    // Vérifier et consommer les crédits
    const hasCredits = await checkCredits(userId, result.creditCost);
    if (!hasCredits) {
      return NextResponse.json(
        { ok: false, error: "Crédits insuffisants." },
        { status: 402 }
      );
    }

    await consumeCredits({
      userId,
      projectId,
      credits: result.creditCost,
      action: `ai.orchestrate.${action}`,
    });

    // Extraire les fichiers générés (si format multi-fichiers)
    const generatedFiles = parseGeneratedFiles(result.result);

    // Validation de sécurité des fichiers générés
    if (generatedFiles.length > 0) {
      const fileActions: FileAction[] = generatedFiles.map((f) => ({
        path: f.path,
        type: "create" as const,
        content: f.content,
      }));

      const safetyReport = validateActions(fileActions, filePaths);
      if (!safetyReport.valid) {
        return NextResponse.json({
          ok: true,
          message: result.result,
          previews: generatedFiles,
          model: result.model,
          complexity: result.complexity,
          creditsUsed: result.creditCost,
          safetyWarnings: safetyReport.errors,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: result.result,
      previews: generatedFiles.length > 0 ? generatedFiles : undefined,
      model: result.model,
      complexity: result.complexity,
      creditsUsed: result.creditCost,
    });
  } catch (err) {
    console.error("❌ Erreur d'orchestration IA :", err);
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
