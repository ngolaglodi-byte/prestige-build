import { prisma } from "@/lib/prisma";
import { AIAction } from "./types";

export async function executeAIActions(projectId: string, actions: AIAction[]) {
  for (const action of actions) {
    if (action.type === "create_file") {
      await prisma.file.create({
        data: {
          projectId,
          path: action.path,
          content: action.content,
        },
      });
    }

    if (action.type === "update_file") {
      await prisma.file.update({
        where: {
          projectId_path: {
            projectId,
            path: action.path,
          },
        },
        data: {
          content: action.content,
        },
      });
    }

    if (action.type === "delete_file") {
      await prisma.file.delete({
        where: {
          projectId_path: {
            projectId,
            path: action.path,
          },
        },
      });
    }

    if (action.type === "rename_file") {
      await prisma.file.update({
        where: {
          projectId_path: {
            projectId,
            path: action.oldPath,
          },
        },
        data: {
          path: action.newPath,
        },
      });
    }
  }
}
