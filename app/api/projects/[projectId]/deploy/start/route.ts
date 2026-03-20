import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { deployProject } from "@/lib/deploy/deployManager";
import { setDeployState } from "@/lib/deploy/deployRegistry";

export async function POST(_req: Request, { params }: { params: { projectId: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;

  setDeployState(projectId, {
    status: "building",
    logs: "Starting deployment...\n",
  });

  deployProject(projectId);

  return NextResponse.json({ started: true });
}
