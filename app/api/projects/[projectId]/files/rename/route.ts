import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { renameProjectFile } from "@/lib/projects/fileSystem";

export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Error renaming file: ${message}`, { status: 500 });
  }
}
