import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { orchestrate } from "@/lib/ai/orchestrator";
import { parseAIMultiPreview } from "@/lib/ai/parseMultiPreview";
import { apiOk, apiError } from "@/lib/api-response";
import logger from "@/lib/logger";

const PostBody = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  action: z.enum(["generate", "generate_multi", "refactor", "explain", "fix", "create_project"]).optional().default("generate_multi"),
  model: z.enum(["claude", "gemini", "gpt"]).optional(),
  code: z.string().optional(),
  filePath: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.status !== "ACTIVE") {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const parsed = PostBody.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);
    }

    const { prompt, action, model, code, filePath } = parsed.data;
    const projectId = params.projectId;

    // Only select the columns we need to avoid issues with missing columns
    const projectRows = await db
      .select({ id: projects.id, userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const project = projectRows[0];

    if (!project) {
      return apiError("Project not found", 404);
    }

    if (project.userId !== currentUser.id) {
      return apiError("Access denied", 403);
    }

    const result = await orchestrate({
      action,
      prompt,
      model,
      code,
      filePath,
    });

    const previews = parseAIMultiPreview(result.result);

    return apiOk({
      previews,
      model: result.model,
      complexity: result.complexity,
      creditCost: result.creditCost,
    });
  } catch (err) {
    logger.error({ err }, "AI route error");
    return apiError("Internal server error", 500);
  }
}
