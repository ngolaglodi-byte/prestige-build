import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  addMessage,
  extractRequirements,
  advancePhase,
  shouldAdvance,
  buildConversationPrompt,
} from "@/lib/ai/conversational-flow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, message, sessionData } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: "projectId et message sont requis" },
        { status: 400 }
      );
    }

    // Create or continue session
    let session = sessionData
      ? sessionData
      : createSession(projectId);

    // Add user message
    session = addMessage(session, "user", message);

    // Extract requirements from conversation history
    session.requirements = extractRequirements(session.messages);

    // Check if we should advance phase
    if (shouldAdvance(session)) {
      session = advancePhase(session);
    }

    // Build prompt for AI based on current phase
    const prompt = buildConversationPrompt(session);

    // Add assistant response placeholder
    session = addMessage(session, "assistant", prompt);

    return NextResponse.json({ session, prompt });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
