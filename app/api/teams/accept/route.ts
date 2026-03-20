import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { teamMembers, users, notifications, teams } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/teams/accept — Accept a team invitation
export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.currentUser.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { memberId } = await req.json();
  if (!memberId) {
    return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
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
    return NextResponse.json({ error: "Invitation not found or already accepted" }, { status: 404 });
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
