import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { teamProjects, teamMembers, projects, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/teams/[teamId]/projects — List projects shared with a team
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
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
    return new Response("Accès refusé", { status: 403 });
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
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response("Non autorisé", { status: 401 });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  if (!user) return new Response("Utilisateur introuvable", { status: 404 });

  // Verify the caller is owner or admin
  const [callerMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, user.id))
    )
    .limit(1);
  if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
    return new Response(
      "Seuls les propriétaires et administrateurs peuvent ajouter des projets",
      { status: 403 }
    );
  }

  const { projectId } = await req.json();
  if (!projectId) return new Response("ID du projet requis", { status: 400 });

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
    return new Response("Projet déjà ajouté à cette équipe", { status: 409 });
  }

  const [tp] = await db
    .insert(teamProjects)
    .values({ teamId, projectId, addedBy: user.id })
    .returning();

  return NextResponse.json({ teamProject: tp });
}
