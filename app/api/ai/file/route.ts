import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import { consumeCredits } from "@/lib/credits/consumeCredits";
import { checkCredits } from "@/lib/credits/checkCredits";
import {
  readProjectFileContent,
  writeSingleFile,
} from "@/lib/projects/fileSystem";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  if (!process.env.OPENAI_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 503 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

  const { projectId, filePath, instructions } = await req.json();

  if (!projectId || !filePath || !instructions) {
    return NextResponse.json(
      { error: "projectId, filePath and instructions are required" },
      { status: 400 }
    );
  }

  const CREDITS_COST = 5;

  const hasCredits = await checkCredits(userId, CREDITS_COST);
  if (!hasCredits) {
    return NextResponse.json(
      { error: "Not enough credits" },
      { status: 402 }
    );
  }

  const currentContent =
    readProjectFileContent(projectId, filePath) ?? "";

  await consumeCredits({
    userId,
    projectId,
    credits: CREDITS_COST,
    action: "ai.file.edit",
  });

  const systemPrompt = `
You are a senior code editor.
You will receive the current content of a file and instructions.
You MUST return ONLY the new full content of the file.
Do NOT explain, do NOT wrap in backticks, just the raw code.
  `;

  const userPrompt = `
File path: ${filePath}

Current content:
${currentContent}

Instructions:
${instructions}
  `;

  const completion = await client.chat.completions.create({
    model: "gpt-4.1",
    max_tokens: 65000, // <-- correction ici
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const newContent = completion.choices[0].message.content ?? "";

  writeSingleFile(projectId, filePath, newContent);

  return NextResponse.json({
    success: true,
    projectId,
    filePath,
    creditsUsed: CREDITS_COST,
  });
}
