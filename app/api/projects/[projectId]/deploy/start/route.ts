import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deployProject } from "@/lib/deploy/deployManager";
import { setDeployState } from "@/lib/deploy/deployRegistry";

export async function POST(_req: Request, { params }: any) {
  const { userId } = auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;

  setDeployState(projectId, {
    status: "building",
    logs: "Starting deployment...\n",
  });

  deployProject(projectId);

  return NextResponse.json({ started: true });
}
