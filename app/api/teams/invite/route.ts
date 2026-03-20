import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { teams, teamMembers, users, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/teams/invite — Invite a member to a team
export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.currentUser.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { teamId, email, role } = await req.json();

  if (!teamId || !email) {
    return NextResponse.json({ error: "Team ID and email are required" }, { status: 400 });
  }

  const memberRole = role || "member";
  if (!["admin", "member"].includes(memberRole)) {
    return NextResponse.json({ error: "Invalid role. Use 'admin' or 'member'" }, { status: 400 });
  }

  // Verify the team exists and the user is owner or admin
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Allow if the user is the team owner directly
  const isTeamOwner = team.ownerId === user.id;

  if (!isTeamOwner) {
    const [callerMember] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id))
      )
      .limit(1);

    if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can invite members" },
        { status: 403 }
      );
    }
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
    return NextResponse.json({ error: "This member is already invited" }, { status: 409 });
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
