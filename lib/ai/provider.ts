import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type AIModel = "claude" | "gemini" | "gpt";

export interface GenerateOptions {
  maxTokens?: number;
  systemPrompt?: string;
}

const FALLBACK_ORDER: AIModel[] = ["gpt", "claude", "gemini"];

export class AIProvider {
  private claude: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private gpt: OpenAI | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.claude = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    if (process.env.OPENAI_API_KEY || process.env.OPENAI_KEY) {
      this.gpt = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY,
      });
    }
  }

  /** Returns which providers are available */
  getAvailableModels(): AIModel[] {
    const models: AIModel[] = [];
    if (this.gpt) models.push("gpt");
    if (this.claude) models.push("claude");
    if (this.gemini) models.push("gemini");
    return models;
  }

  /** Resolve the best available model, preferring the requested one */
  resolveModel(preferred?: AIModel): AIModel {
    if (preferred && this.isModelAvailable(preferred)) return preferred;
    const available = this.getAvailableModels();
    if (available.length === 0) throw new Error("Aucun fournisseur IA configuré");
    return available[0];
  }

  isModelAvailable(model: AIModel): boolean {
    switch (model) {
      case "claude": return !!this.claude;
      case "gemini": return !!this.gemini;
      case "gpt": return !!this.gpt;
      default: return false;
    }
  }

  async generate(model: AIModel, prompt: string, options?: GenerateOptions) {
    switch (model) {
      case "claude":
        return await this.generateClaude(prompt, options);
      case "gemini":
        return await this.generateGemini(prompt, options);
      case "gpt":
        return await this.generateGPT(prompt, options);
      default:
        throw new Error("Modèle inconnu");
    }
  }

  /** Generate with automatic retry and fallback to other providers */
  async generateWithFallback(
    preferredModel: AIModel,
    prompt: string,
    options?: GenerateOptions,
    maxRetries = 1
  ): Promise<{ result: string; model: AIModel }> {
    const modelsToTry = [
      preferredModel,
      ...FALLBACK_ORDER.filter((m) => m !== preferredModel),
    ].filter((m) => this.isModelAvailable(m));

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.generate(model, prompt, options);
          return { result, model };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }
    }

    throw lastError ?? new Error("Tous les fournisseurs IA ont échoué");
  }

  private async generateClaude(prompt: string, options?: GenerateOptions) {
    if (!this.claude) throw new Error("Claude non configuré");

    const maxTokens = options?.maxTokens ?? 4000;

    const res = await this.claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      ...(options?.systemPrompt ? { system: options.systemPrompt } : {}),
      messages: [{ role: "user", content: prompt }],
    });

    // Extraction propre du texte
    const text = res.content
      ?.filter((c: { type: string }) => c.type === "text")
      .map((c: { type: string; text?: string }) => c.text)
      .join("\n");

    return text ?? "";
  }

  private async generateGemini(prompt: string, options?: GenerateOptions) {
    if (!this.gemini) throw new Error("Gemini non configuré");

    const model = this.gemini.getGenerativeModel({
      model: "gemini-1.5-pro",
    });

    const fullPrompt = options?.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;
    const res = await model.generateContent(fullPrompt);
    return res.response.text();
  }

  private async generateGPT(prompt: string, options?: GenerateOptions) {
    if (!this.gpt) throw new Error("GPT non configuré");

    const messages: { role: "system" | "user"; content: string }[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const res = await this.gpt.chat.completions.create({
      model: "gpt-4.1",
      messages,
      max_tokens: options?.maxTokens ?? 4000,
    });

    return res.choices[0].message.content ?? "";
  }
}
