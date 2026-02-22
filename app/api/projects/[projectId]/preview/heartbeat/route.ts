// app/api/projects/[projectId]/preview/heartbeat/route.ts

import { NextRequest, NextResponse } from "next/server";
import { registerHeartbeat } from "@/lib/preview/previewEngine";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const userId = await getCurrentUserId();
  const { projectId } = params;

  registerHeartbeat(userId, projectId);

  return NextResponse.json({ ok: true });
}
