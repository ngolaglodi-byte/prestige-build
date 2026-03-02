// app/api/projects/[projectId]/export/github/route.ts
// POST /api/projects/[projectId]/export/github — Export project to GitHub.

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { rateLimitAsync } from "@/lib/rate-limit";
import { apiOk, apiError } from "@/lib/api-response";
import logger from "@/lib/logger";
import { exportToGitHub } from "@/lib/github/exporter";

const RequestBody = z.object({
  repoName: z.string().min(1, "Repository name is required").max(100),
  repoDescription: z.string().max(255).optional(),
  isPrivate: z.boolean().optional().default(false),
  githubToken: z.string().min(1, "GitHub token is required"),
  branch: z.string().optional().default("main"),
  commitMessage: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError("Unauthorized", 401);

    const rl = await rateLimitAsync(`github:export:${userId}`, 10, 60_000);
    if (!rl.success) return apiError("Too many requests", 429);

    const body = await req.json();
    const parsed = RequestBody.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid data", 422);
    }

    const { projectId } = params;
    const { repoName, repoDescription, isPrivate, githubToken, branch, commitMessage } = parsed.data;

    logger.info({ userId, projectId, repoName }, "GitHub export triggered");

    const result = await exportToGitHub({
      projectId,
      repoName,
      repoDescription,
      isPrivate,
      githubToken,
      branch,
      commitMessage,
    });

    return apiOk(result);
  } catch (err) {
    logger.error({ err }, "GitHub export unexpected error");
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}
