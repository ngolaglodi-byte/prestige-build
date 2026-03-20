// app/api/showcase/route.ts
// GET — public listing with pagination, filters
// POST — submit a project to the showcase (requires auth)

import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";
import { db } from "@/db/client";
import { showcaseProjects, users } from "@/db/schema";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { rateLimitAsync } from "@/lib/rate-limit";
import { apiOk, apiError } from "@/lib/api-response";
import logger from "@/lib/logger";

const SubmitBody = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(255).optional(),
  thumbnailUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  category: z.string().max(50).optional().default("other"),
  tags: z.array(z.string()).max(10).optional().default([]),
  techStack: z.array(z.string()).max(20).optional().default([]),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "12")));
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const sort = searchParams.get("sort") ?? "newest";
    const featured = searchParams.get("featured") === "true";

    const conditions = [eq(showcaseProjects.status, "approved")];

    if (search) {
      conditions.push(ilike(showcaseProjects.title, `%${search}%`));
    }
    if (category) {
      conditions.push(eq(showcaseProjects.category, category));
    }
    if (featured) {
      conditions.push(eq(showcaseProjects.featured, true));
    }

    const orderBy =
      sort === "popular"
        ? desc(showcaseProjects.likes)
        : sort === "views"
        ? desc(showcaseProjects.views)
        : sort === "remixes"
        ? desc(showcaseProjects.remixCount)
        : desc(showcaseProjects.publishedAt);

    const offset = (page - 1) * pageSize;

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(showcaseProjects)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(showcaseProjects)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return apiOk({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    logger.error({ err }, "Showcase GET error");
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return apiError("Unauthorized", 401);

    const rl = await rateLimitAsync(`showcase:submit:${currentUser.id}`, 5, 3_600_000);
    if (!rl.success) return apiError("Too many submissions", 429);

    const body = await req.json();
    const parsed = SubmitBody.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid data", 422);
    }

    // Resolve Clerk ID to internal user
    const userRows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.currentUser.id, currentUser.id))
      .limit(1);

    if (!userRows.length) return apiError("User not found", 404);
    const userId = userRows[0].id;

    const data = parsed.data;

    const [created] = await db
      .insert(showcaseProjects)
      .values({
        projectId: data.projectId,
        userId,
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        thumbnailUrl: data.thumbnailUrl,
        liveUrl: data.liveUrl,
        repoUrl: data.repoUrl,
        category: data.category,
        tags: data.tags,
        techStack: data.techStack,
        status: "pending",
      })
      .returning();

    logger.info({ userId, showcaseId: created.id }, "Showcase project submitted");

    return apiOk(created, 201);
  } catch (err) {
    logger.error({ err }, "Showcase POST error");
    const message = err instanceof Error ? err.message : "Internal error";
    return apiError(message, 500);
  }
}
