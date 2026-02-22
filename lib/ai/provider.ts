import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type AIModel = "claude" | "gemini" | "gpt";

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

    if (process.env.OPENAI_API_KEY) {
      this.gpt = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async generate(model: AIModel, prompt: string) {
    switch (model) {
      case "claude":
        return await this.generateClaude(prompt);
      case "gemini":
        return await this.generateGemini(prompt);
      case "gpt":
        return await this.generateGPT(prompt);
      default:
        throw new Error("Unknown model");
    }
  }

  private async generateClaude(prompt: string) {
    if (!this.claude) throw new Error("Claude not configured");

    const res = await this.claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    // Extraction propre du texte
    const text = res.content
      ?.filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");

    return text ?? "";
  }

  private async generateGemini(prompt: string) {
    if (!this.gemini) throw new Error("Gemini not configured");

    const model = this.gemini.getGenerativeModel({
      model: "gemini-1.5-pro",
    });

    const res = await model.generateContent(prompt);
    return res.response.text();
  }

  private async generateGPT(prompt: string) {
    if (!this.gpt) throw new Error("GPT not configured");

    const res = await this.gpt.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
    });

    return res.choices[0].message.content ?? "";
  }
}
