import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDeployState } from "@/lib/deploy/deployRegistry";

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { projectId } = params;
  const state = getDeployState(projectId) ?? {
    status: "idle",
    logs: "",
  };

  return NextResponse.json(state);
}
