import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { teams, teamMembers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/teams/create — Create a new team
export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return new Response("Utilisateur introuvable", { status: 404 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return new Response("Le nom de l'équipe est requis", { status: 400 });
  }

  const [team] = await db
    .insert(teams)
    .values({ name: name.trim(), ownerId: user.id })
    .returning();

  // Add the owner as a member with "owner" role
  await db.insert(teamMembers).values({
    teamId: team.id,
    userId: user.id,
    ownerId: user.id,
    email: user.email,
    name: user.name,
    role: "owner",
    status: "active",
  });

  return NextResponse.json({ team });
}
