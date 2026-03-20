import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/db/client";
import { teamProjects, teamMembers, users } from "@/db/schema";
import { projects } from "@/db/supabase-schema";
import { eq, and } from "drizzle-orm";

// GET /api/teams/[teamId]/projects — List projects shared with a team
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
    .where(eq(users.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ projects: [] });

  // Verify the caller is an active member
  const [callerMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, user.id),
        eq(teamMembers.status, "active")
      )
    )
    .limit(1);
  if (!callerMember) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const teamProjectList = await db
    .select({ project: projects, teamProject: teamProjects })
    .from(teamProjects)
    .innerJoin(projects, eq(projects.id, teamProjects.projectId))
    .where(eq(teamProjects.teamId, teamId));

  return NextResponse.json({
    projects: teamProjectList.map((tp) => tp.project),
  });
}

// POST /api/teams/[teamId]/projects — Add a project to a team
export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Verify the caller is owner or admin
  const [callerMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id))
    )
    .limit(1);
  if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
    return NextResponse.json({ error: "Only owners and admins can add projects" }, { status: 403 });
  }

  const { projectId } = await req.json();
  if (!projectId) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });

  // Check if already added
  const [existing] = await db
    .select()
    .from(teamProjects)
    .where(
      and(
        eq(teamProjects.teamId, teamId),
        eq(teamProjects.projectId, projectId)
      )
    )
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "Project already added to this team" }, { status: 409 });
  }

  const [tp] = await db
    .insert(teamProjects)
    .values({ teamId, projectId, addedBy: user.id })
    .returning();

  return NextResponse.json({ teamProject: tp });
}
