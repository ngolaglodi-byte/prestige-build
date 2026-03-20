import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { teams, teamMembers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/teams/create — Create a new team
export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
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
