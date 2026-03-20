import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { teams, teamMembers, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";

// GET /api/teams — List teams where the user is owner or accepted member
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.currentUser.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ teams: [] });

  // Teams the user owns
  const ownedTeams = await db
    .select()
    .from(teams)
    .where(eq(teams.ownerId, user.id));

  // Teams where user is an accepted member
  const memberTeams = await db
    .select({ team: teams })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(
      or(
        eq(teamMembers.userId, user.id),
        eq(teamMembers.email, user.email)
      )
    );

  const memberTeamList = memberTeams
    .map((r) => r.team)
    .filter((t) => !ownedTeams.some((ot) => ot.id === t.id));

  const allTeams = [...ownedTeams, ...memberTeamList].map((t) => ({
    ...t,
    isOwner: t.ownerId === user.id,
  }));

  return NextResponse.json({ teams: allTeams });
}
