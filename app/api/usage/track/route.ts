import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { trackUsage } from "@/lib/usage/trackUsage";

const ALLOWED_ACTIONS = [
  "workspace.file.create",
  "workspace.file.update",
  "workspace.file.delete",
  "workspace.file.rename",
  "workspace.project.create",
  "workspace.project.delete",
  "workspace.project.rename",
  "workspace.project.duplicate",
  "workspace.preview.start",
  "workspace.preview.stop",
  "workspace.export",
];

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const { action, projectId, metadata } = await req.json();

  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json(
      { error: "Action non valide" },
      { status: 400 }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur non trouvé" },
      { status: 404 }
    );
  }

  await trackUsage({
    userId: user.id,
    projectId: projectId ?? null,
    action,
    metadata: metadata ?? {},
  });

  return NextResponse.json({ success: true });
}
