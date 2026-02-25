import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { projects } from "@/db/supabase-schema";
import { eq } from "drizzle-orm";
import { orchestrate } from "@/lib/ai/orchestrator";
import { parseAIMultiPreview } from "@/lib/ai/parseMultiPreview";
import { apiOk, apiError } from "@/lib/api-response";
import logger from "@/lib/logger";

const PostBody = z.object({
  prompt: z.string().min(1, "Le prompt est requis"),
  action: z.enum(["generate", "generate_multi", "refactor", "explain", "fix", "create_project"]).optional().default("generate_multi"),
  model: z.enum(["claude", "gemini", "gpt"]).optional(),
  code: z.string().optional(),
  filePath: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return apiError("Unauthorized", 401);

    const body = await req.json();
    const parsed = PostBody.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid input", 422);
    }

    const { prompt, action, model, code, filePath } = parsed.data;
    const projectId = params.projectId;

    // Resolve Clerk ID to internal user UUID
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    const user = userRows[0];
    if (!user) return apiError("User not found", 404);

    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const project = projectRows[0];

    if (!project || project.userId !== user.id) {
      return apiError("Forbidden", 403);
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
