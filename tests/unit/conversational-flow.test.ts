import { describe, it, expect, beforeEach } from "vitest";
import {
  createSession,
  addMessage,
  extractRequirements,
  advancePhase,
  shouldAdvance,
  buildConversationPrompt,
  resetMessageCounter,
} from "@/lib/ai/conversational-flow";

describe("ai/conversational-flow", () => {
  beforeEach(() => {
    resetMessageCounter();
  });

  describe("createSession", () => {
    it("creates a session with gathering phase", () => {
      const session = createSession("project-1");
      expect(session.projectId).toBe("project-1");
      expect(session.phase).toBe("gathering");
      expect(session.messages).toHaveLength(0);
      expect(session.requirements.features).toHaveLength(0);
    });
  });

  describe("addMessage", () => {
    it("appends a message to the session", () => {
      let session = createSession("p1");
      session = addMessage(session, "user", "Crée une app de e-commerce");
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].role).toBe("user");
      expect(session.messages[0].content).toBe("Crée une app de e-commerce");
    });

    it("assigns incrementing message IDs", () => {
      let session = createSession("p1");
      session = addMessage(session, "user", "First");
      session = addMessage(session, "assistant", "Second");
      expect(session.messages[0].id).toBe("msg_1");
      expect(session.messages[1].id).toBe("msg_2");
    });
  });

  describe("extractRequirements", () => {
    it("detects authentication keywords", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Je veux un login et signup", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.hasAuth).toBe(true);
      expect(reqs.features).toContain("authentication");
    });

    it("detects database keywords", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Avec une base de données", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.hasDatabase).toBe(true);
      expect(reqs.features).toContain("database");
    });

    it("detects API keywords", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Des API endpoints REST", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.hasApi).toBe(true);
    });

    it("detects payment keywords", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Intégration Stripe avec checkout", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.hasPayments).toBe(true);
    });

    it("detects page names", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Pages: dashboard, profil, settings", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.pages).toContain("dashboard");
      expect(reqs.pages).toContain("profil");
      expect(reqs.pages).toContain("settings");
    });

    it("detects Vue project type", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Crée un projet Vue", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.projectType).toBe("vue");
    });

    it("defaults to nextjs project type", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Crée une application web", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.projectType).toBe("nextjs");
    });

    it("ignores assistant messages", () => {
      const messages = [
        { id: "1", role: "assistant" as const, content: "Login is detected", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.hasAuth).toBe(false);
    });
  });

  describe("advancePhase", () => {
    it("advances from gathering to planning", () => {
      const session = createSession("p1");
      const advanced = advancePhase(session);
      expect(advanced.phase).toBe("planning");
    });

    it("advances through all phases sequentially", () => {
      let session = createSession("p1");
      session = advancePhase(session); // planning
      session = advancePhase(session); // generating
      session = advancePhase(session); // reviewing
      session = advancePhase(session); // modifying
      session = advancePhase(session); // completed
      expect(session.phase).toBe("completed");
    });

    it("stays at completed phase", () => {
      let session = createSession("p1");
      session.phase = "completed";
      session = advancePhase(session);
      expect(session.phase).toBe("completed");
    });
  });

  describe("shouldAdvance", () => {
    it("returns false for gathering without features", () => {
      const session = createSession("p1");
      expect(shouldAdvance(session)).toBe(false);
    });

    it("returns true for gathering with features and messages", () => {
      let session = createSession("p1");
      session = addMessage(session, "user", "test");
      session.requirements.features = ["auth"];
      expect(shouldAdvance(session)).toBe(true);
    });

    it("returns true for planning phase", () => {
      let session = createSession("p1");
      session.phase = "planning";
      expect(shouldAdvance(session)).toBe(true);
    });

    it("returns false for completed phase", () => {
      const session = createSession("p1");
      session.phase = "completed";
      expect(shouldAdvance(session)).toBe(false);
    });
  });

  describe("buildConversationPrompt", () => {
    it("returns gathering prompt for gathering phase", () => {
      const session = createSession("p1");
      const prompt = buildConversationPrompt(session);
      expect(prompt).toContain("décrit une application");
    });

    it("returns planning prompt with requirements", () => {
      const session = createSession("p1");
      session.phase = "planning";
      session.requirements.features = ["auth", "database"];
      const prompt = buildConversationPrompt(session);
      expect(prompt).toContain("plan d'architecture");
    });

    it("returns generating prompt", () => {
      const session = createSession("p1");
      session.phase = "generating";
      const prompt = buildConversationPrompt(session);
      expect(prompt).toContain("Génère le code");
    });
  });
});
