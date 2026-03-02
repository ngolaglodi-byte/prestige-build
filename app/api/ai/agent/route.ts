import { NextRequest, NextResponse } from "next/server";
import { buildPlan, type AgentContext } from "@/lib/ai/agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, userMessage, projectType, existingFiles } = body;

    if (!projectId || !userMessage) {
      return NextResponse.json(
        { error: "projectId et userMessage sont requis" },
        { status: 400 }
      );
    }

    const context: AgentContext = {
      projectId,
      userMessage,
      projectType,
      existingFiles,
    };

    const plan = buildPlan(context);

    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
