import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { teamMembers, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
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
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const { id } = await req.json();
  await db.delete(teamMembers).where(eq(teamMembers.id, id));

  return NextResponse.json({ deleted: true });
}
