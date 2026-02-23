import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { teamMembers, users, notifications, teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/teams/accept — Accept a team invitation
export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return new Response("Utilisateur introuvable", { status: 404 });

  const { memberId } = await req.json();
  if (!memberId) {
    return new Response("L'identifiant de l'invitation est requis", { status: 400 });
  }

  // Find the pending invitation
  const [invitation] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.id, memberId),
        eq(teamMembers.email, user.email),
        eq(teamMembers.status, "pending")
      )
    )
    .limit(1);

  if (!invitation) {
    return new Response("Invitation introuvable ou déjà acceptée", { status: 404 });
  }

  // Accept the invitation
  const [updated] = await db
    .update(teamMembers)
    .set({ status: "active", userId: user.id, name: user.name })
    .where(eq(teamMembers.id, memberId))
    .returning();

  // Notify the team owner
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, invitation.teamId))
    .limit(1);

  if (team) {
    await db.insert(notifications).values({
      userId: team.ownerId,
      type: "team_accept",
      title: "Invitation acceptée",
      message: `${user.name || user.email} a accepté l'invitation à rejoindre l'équipe "${team.name}".`,
    });
  }

  return NextResponse.json({ member: updated });
}
