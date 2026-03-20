import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { teamMembers, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.currentUser.id, currentUser.id)).limit(1);
  if (!user) return NextResponse.json({ members: [] });

  const members = await db
    .select()
    .from(teamMembers)
    .where(
      or(eq(teamMembers.ownerId, user.id), eq(teamMembers.userId, user.id))
    );

  return NextResponse.json({ members });
}

export async function DELETE(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(teamMembers).where(eq(teamMembers.id, id));

  return NextResponse.json({ deleted: true });
}
