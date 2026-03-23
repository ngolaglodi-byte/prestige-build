import { getCurrentUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { files, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { orchestrate, type OrchestrationAction } from "@/lib/ai/orchestrator";
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
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.status !== "ACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const { prompt, filePath, code, model } = body;

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "Prompt is required." },
        { status: 400 }
      );
    }

    const userId = currentUser.id;

    // Vérifier que le projet existe et appartient à l'utilisateur
    // Only select the columns we need to avoid issues with missing columns
    const projectRows = await db
      .select({ id: projects.id, userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    const project = projectRows[0];

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Projet non trouvé." },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: "Accès refusé." },
        { status: 403 }
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
    console.error("❌ AI orchestration error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
