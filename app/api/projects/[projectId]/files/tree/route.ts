import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listProjectTree, buildTree } from "@/lib/projects/fileSystem";

type Params = {
  params: {
    projectId: string;
  };
};

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = params;

  // 1. On récupère la liste plate
  const flat = listProjectTree(projectId);

  // 2. On la convertit en arbre hiérarchique
  const tree = buildTree(flat);

  return NextResponse.json({ projectId, tree });
}
