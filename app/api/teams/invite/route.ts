import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { teams, teamMembers, users, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/teams/invite — Invite a member to a team
export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return new Response("Utilisateur introuvable", { status: 404 });

  const { teamId, email, role } = await req.json();

  if (!teamId || !email) {
    return new Response("L'identifiant de l'équipe et l'email sont requis", { status: 400 });
  }

  const memberRole = role || "member";
  if (!["admin", "member"].includes(memberRole)) {
    return new Response("Rôle invalide. Utilisez 'admin' ou 'member'", { status: 400 });
  }

  // Verify the team exists and the user is owner or admin
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  if (!team) return new Response("Équipe introuvable", { status: 404 });

  const [callerMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id))
    )
    .limit(1);

  if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
    return new Response(
      "Seuls les propriétaires et administrateurs peuvent inviter des membres",
      { status: 403 }
    );
  }

  // Check if already invited
  const [existing] = await db
    .select()
    .from(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.email, email))
    )
    .limit(1);
  if (existing) {
    return new Response("Ce membre est déjà invité", { status: 409 });
  }

  // Resolve invited user if they already exist
  const [invitedUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const [member] = await db
    .insert(teamMembers)
    .values({
      teamId,
      userId: invitedUser?.id ?? null,
      ownerId: team.ownerId,
      email,
      name: invitedUser?.name ?? null,
      role: memberRole,
      status: "pending",
    })
    .returning();

  // Send notification to the invited user if they exist
  if (invitedUser) {
    await db.insert(notifications).values({
      userId: invitedUser.id,
      type: "team_invite",
      title: "Invitation à rejoindre une équipe",
      message: `Vous avez été invité à rejoindre l'équipe "${team.name}" en tant que ${memberRole === "admin" ? "administrateur" : "membre"}.`,
    });
  }

  return NextResponse.json({ member });
}
