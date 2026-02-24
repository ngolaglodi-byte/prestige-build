import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { projects } from "@/db/supabase-schema";
import { eq } from "drizzle-orm";
import { parseAIMultiPreview } from "@/lib/ai/parseMultiPreview";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) return new Response("Missing prompt", { status: 400 });

    // Resolve Clerk ID to internal user UUID
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    const user = userRows[0];
    if (!user) return new Response("User not found", { status: 404 });

    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const project = projectRows[0];

    if (!project || project.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // MOCK AI MULTI‑FILE PREVIEW
    const aiResponse = `
<file path="src/app/page.tsx">
<old>
console.log("Old code");
</old>
<new>
console.log("New AI code");
</new>
</file>

<file path="src/app/layout.tsx">
<old>
<div>Old layout</div>
</old>
<new>
<div>New AI layout</div>
</new>
</file>
`;

    const previews = parseAIMultiPreview(aiResponse);

    return NextResponse.json({
      ok: true,
      previews,
    });
  } catch (err) {
    console.error("❌ AI error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
