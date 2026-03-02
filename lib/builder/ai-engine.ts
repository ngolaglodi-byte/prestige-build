/**
 * AI engine for the builder module.
 * Uses the OpenAI SDK (already installed) to generate code from prompts.
 */

import OpenAI from "openai";
import {
  SYSTEM_PROMPT_GENERATE,
  SYSTEM_PROMPT_ITERATE,
  buildGeneratePrompt,
  buildIteratePrompt,
} from "./prompt-templates";
import { parseGeneratedFiles } from "./code-generator";
import type { GeneratedFile } from "./template-engine";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
}

function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4-turbo";
}

export interface BuilderMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Generate code from a user prompt (first request).
 */
export async function generateFromPrompt(
  userMessage: string,
  history: BuilderMessage[] = []
): Promise<{ files: GeneratedFile[]; rawResponse: string }> {
  const client = getClient();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT_GENERATE },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: buildGeneratePrompt(userMessage) },
  ];

  const response = await client.chat.completions.create({
    model: getModel(),
    messages,
    temperature: 0.2,
    max_tokens: 4096,
  });

  const rawResponse = response.choices[0]?.message?.content ?? "[]";
  const files = parseGeneratedFiles(rawResponse);
  return { files, rawResponse };
}

/**
 * Iterate on existing code based on a modification request.
 */
export async function iterateOnCode(
  userMessage: string,
  existingFiles: GeneratedFile[],
  history: BuilderMessage[] = []
): Promise<{ files: GeneratedFile[]; rawResponse: string }> {
  const client = getClient();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT_ITERATE },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: buildIteratePrompt(userMessage, existingFiles) },
  ];

  const response = await client.chat.completions.create({
    model: getModel(),
    messages,
    temperature: 0.2,
    max_tokens: 4096,
  });

  const rawResponse = response.choices[0]?.message?.content ?? "[]";
  const files = parseGeneratedFiles(rawResponse);
  return { files, rawResponse };
}
