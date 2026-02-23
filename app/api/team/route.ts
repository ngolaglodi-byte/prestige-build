import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { teamMembers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return NextResponse.json({ members: [] });

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.ownerId, user.id));

  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (!user) return new Response("User not found", { status: 404 });

  const { email, name, role } = await req.json();

  if (!email) return new Response("Email is required", { status: 400 });

  const [member] = await db.insert(teamMembers).values({
    ownerId: user.id,
    email,
    name: name ?? null,
    role: role || "member",
  }).returning();

  return NextResponse.json({ member });
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Unauthorized", { status: 401 });

  const { id } = await req.json();
  await db.delete(teamMembers).where(eq(teamMembers.id, id));

  return NextResponse.json({ deleted: true });
}
