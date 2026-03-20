import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { teamMembers, teams, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/teams/[teamId]/members — List members of a team
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.currentUser.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ members: [] });

  // Verify the caller is a member of the team or the team owner
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const isTeamOwner = team?.ownerId === user.id;

  if (!isTeamOwner) {
    const [callerMember] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id))
      )
      .limit(1);
    if (!callerMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const members = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  return NextResponse.json({ members });
}

// DELETE /api/teams/[teamId]/members — Remove a member from a team
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.currentUser.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { memberId } = await req.json();
  if (!memberId) return NextResponse.json({ error: "Member ID is required" }, { status: 400 });

  // Verify the caller is owner or admin
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const isTeamOwner = team?.ownerId === user.id;

  if (!isTeamOwner) {
    const [callerMember] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id))
      )
      .limit(1);

    if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
      return NextResponse.json({ error: "Only owners and admins can remove members" }, { status: 403 });
    }
  }

  // Cannot remove the owner
  const [targetMember] = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.id, memberId))
    .limit(1);
  if (targetMember?.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });
  }

  await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

  return NextResponse.json({ deleted: true });
}
