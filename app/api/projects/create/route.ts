import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { ensureUserExists } from "@/lib/ensure-user";
import logger from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      logger.error("[projects/create] Unauthorized: no userId from Clerk");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      logger.error("[projects/create] Validation failed: name is missing or empty");
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const user = await ensureUserExists(clerkId);
    const userId = user.id;

    const supabase = getSupabaseServiceClient();

    const now = new Date().toISOString();
    const id = randomUUID();

    logger.info({ id, userId, name: name.trim() }, "[projects/create] Inserting into table 'projects'");

    const { data, error } = await supabase
      .from("projects")
      .insert({
        id,
        user_id: userId,
        name: name.trim(),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      logger.error({ error }, "[projects/create] Supabase insert error on table 'projects'");
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.info({ projectId: data?.id }, "[projects/create] Successfully inserted into 'projects' table");

    return NextResponse.json({ project: data });
  } catch (err) {
    logger.error({ err }, "[projects/create] Unexpected error");
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
