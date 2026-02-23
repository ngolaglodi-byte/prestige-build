import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAIMultiPreview } from "@/lib/ai/parseMultiPreview";

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const projectId = params.projectId;
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) return new Response("Missing prompt", { status: 400 });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
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
