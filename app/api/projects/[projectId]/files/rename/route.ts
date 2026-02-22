import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { renameProjectFile } from "@/lib/projects/fileSystem";

export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  const { userId } = auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = params;
  const body = await req.json();
  const { oldPath, newPath } = body;

  if (!oldPath || !newPath) {
    return new Response("Missing rename paths", { status: 400 });
  }

  try {
    renameProjectFile(projectId, oldPath, newPath);

    return NextResponse.json({
      status: "success",
      message: "File renamed",
      projectId,
      oldPath,
      newPath,
    });
  } catch (err: any) {
    return new Response(`Error renaming file: ${err.message}`, { status: 500 });
  }
}
