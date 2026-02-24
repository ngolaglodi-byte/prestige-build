import { db } from "@/db/client";
import { files } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AIAction } from "./aiTypes";

export async function executeAIActions(projectId: string, actions: AIAction[]) {
  for (const action of actions) {
    if (action.type === "create_file") {
      await db.insert(files).values({
        projectId,
        path: action.path,
        content: action.content,
      });
    }

    if (action.type === "update_file") {
      await db
        .update(files)
        .set({ content: action.content })
        .where(
          and(
            eq(files.projectId, projectId),
            eq(files.path, action.path)
          )
        );
    }

    if (action.type === "delete_file") {
      await db
        .delete(files)
        .where(
          and(
            eq(files.projectId, projectId),
            eq(files.path, action.path)
          )
        );
    }

    if (action.type === "rename_file") {
      await db
        .update(files)
        .set({ path: action.newPath })
        .where(
          and(
            eq(files.projectId, projectId),
            eq(files.path, action.oldPath)
          )
        );
    }
  }
}
