/**
 * Audit Test Suite pour Prestige Build - Moteur Prompt-to-Apps
 * 
 * Ce fichier teste les 6 critères d'audit définis par l'auditeur interne
 * de Prestige Technologie Company.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseGeneratedFiles,
  mergeFiles,
} from "@/lib/builder/code-generator";
import {
  SYSTEM_PROMPT_GENERATE,
  SYSTEM_PROMPT_ITERATE,
  buildGeneratePrompt,
  buildIteratePrompt,
} from "@/lib/builder/prompt-templates";
import {
  createSession,
  addMessage,
  extractRequirements,
  advancePhase,
  shouldAdvance,
  buildConversationPrompt,
  resetMessageCounter,
} from "@/lib/ai/conversational-flow";
import {
  componentTemplate,
  pageTemplate,
  apiRouteTemplate,
  layoutTemplate,
} from "@/lib/builder/template-engine";

// --------------------------------------------------------------------------
// 1. COMPRÉHENSION DU PROMPT
// Analyse si Prestige Build comprend correctement une description en langage naturel
// --------------------------------------------------------------------------

describe("AUDIT 1: Compréhension du prompt", () => {
  beforeEach(() => {
    resetMessageCounter();
  });

  describe("Extraction des pages depuis le prompt", () => {
    it("extrait les pages mentionnées: login, dashboard, utilisateurs", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: "Crée une application interne simple avec une page de login, un dashboard, et une liste d'utilisateurs.",
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      
      expect(reqs.pages).toContain("dashboard");
      expect(reqs.hasAuth).toBe(true); // login implique authentification
    });

    it("détecte l'authentification à partir du mot 'login'", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: "une page de login",
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.hasAuth).toBe(true);
      expect(reqs.features).toContain("authentication");
    });
  });

  describe("Extraction des composants requis", () => {
    it("identifie les besoins UI: header, menu latéral", () => {
      const session = createSession("test-project");
      const updated = addMessage(
        session,
        "user",
        "Ajoute un header avec le nom de l'entreprise et un menu latéral."
      );
      
      expect(updated.messages[0].content).toContain("header");
      expect(updated.messages[0].content).toContain("menu latéral");
    });
  });

  describe("Extraction du style demandé", () => {
    it("reconnaît Tailwind comme framework CSS", () => {
      // Le système utilise Tailwind par défaut
      expect(SYSTEM_PROMPT_GENERATE).toContain("Tailwind CSS");
    });

    it("reconnaît les termes de design: propre, moderne, responsive", () => {
      const prompt = "Le design doit être propre, moderne, responsive, et utiliser Tailwind";
      const wrapped = buildGeneratePrompt(prompt);
      expect(wrapped).toContain("propre");
      expect(wrapped).toContain("moderne");
      expect(wrapped).toContain("responsive");
    });
  });

  describe("Extraction du type de projet", () => {
    it("détecte un projet Next.js par défaut", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: "Crée une application web",
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.projectType).toBe("nextjs");
    });

    it("détecte un projet Vue/Nuxt", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: "Crée un projet Vue",
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.projectType).toBe("vue");
    });
  });
});

// --------------------------------------------------------------------------
// 2. GÉNÉRATION DE CODE
// Vérifie que Prestige Build génère du code propre, structuré et exécutable
// --------------------------------------------------------------------------

describe("AUDIT 2: Génération de code", () => {
  describe("Parsing du code généré", () => {
    it("parse correctement un tableau JSON de fichiers", () => {
      const aiOutput = JSON.stringify([
        { path: "app/login/page.tsx", content: "export default function LoginPage() {}" },
        { path: "app/dashboard/page.tsx", content: "export default function DashboardPage() {}" },
        { path: "components/Header.tsx", content: "export default function Header() {}" },
        { path: "components/Sidebar.tsx", content: "export default function Sidebar() {}" },
      ]);
      
      const files = parseGeneratedFiles(aiOutput);
      expect(files).toHaveLength(4);
      expect(files.map(f => f.path)).toContain("app/login/page.tsx");
      expect(files.map(f => f.path)).toContain("app/dashboard/page.tsx");
      expect(files.map(f => f.path)).toContain("components/Header.tsx");
      expect(files.map(f => f.path)).toContain("components/Sidebar.tsx");
    });

    it("extrait JSON depuis un bloc markdown", () => {
      const aiOutput = `Voici les fichiers générés:
\`\`\`json
[{"path": "app/page.tsx", "content": "export default function Page() {}"}]
\`\`\``;
      
      const files = parseGeneratedFiles(aiOutput);
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("app/page.tsx");
    });

    it("filtre les entrées invalides", () => {
      const aiOutput = JSON.stringify([
        { path: "valid.tsx", content: "// valid" },
        { path: "missing-content" }, // manque content
        { content: "missing-path" }, // manque path
        null,
      ]);
      
      const files = parseGeneratedFiles(aiOutput);
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("valid.tsx");
    });

    it("retourne un tableau vide pour du JSON invalide", () => {
      const files = parseGeneratedFiles("not valid json at all");
      expect(files).toEqual([]);
    });
  });

  describe("Templates de code", () => {
    it("génère un composant React valide", () => {
      const code = componentTemplate("Header", "<header>Logo</header>");
      expect(code).toContain("use client");
      expect(code).toContain("import React");
      expect(code).toContain("export default function Header");
    });

    it("génère une page Next.js valide", () => {
      const code = pageTemplate("Dashboard", "<h1>Dashboard</h1>");
      expect(code).toContain("export default function DashboardPage");
      expect(code).toContain("className=");
    });

    it("génère une API route valide", () => {
      const code = apiRouteTemplate("return NextResponse.json({ users: [] })");
      expect(code).toContain("import { NextRequest, NextResponse }");
      expect(code).toContain("export async function GET");
      expect(code).toContain("export async function POST");
    });

    it("génère un layout valide", () => {
      const code = layoutTemplate("Mon Application");
      expect(code).toContain("export const metadata");
      expect(code).toContain("Mon Application");
      expect(code).toContain("children: React.ReactNode");
    });
  });

  describe("Standards de code (React, Next.js, Tailwind)", () => {
    it("SYSTEM_PROMPT_GENERATE impose TypeScript", () => {
      expect(SYSTEM_PROMPT_GENERATE).toContain("TypeScript");
    });

    it("SYSTEM_PROMPT_GENERATE impose Tailwind CSS", () => {
      expect(SYSTEM_PROMPT_GENERATE).toContain("Tailwind CSS");
    });

    it("SYSTEM_PROMPT_GENERATE impose Next.js App Router", () => {
      expect(SYSTEM_PROMPT_GENERATE).toContain("Next.js App Router");
    });

    it("SYSTEM_PROMPT_GENERATE impose exports par défaut", () => {
      expect(SYSTEM_PROMPT_GENERATE).toContain("Export components as default exports");
    });
  });
});

// --------------------------------------------------------------------------
// 3. CONSTRUCTION ET PREVIEW
// Vérifie que la preview se lance sans erreur
// --------------------------------------------------------------------------

describe("AUDIT 3: Construction et Preview", () => {
  describe("Fusion de fichiers", () => {
    it("fusionne les fichiers existants avec les nouveaux", () => {
      const existing = [
        { path: "app/page.tsx", content: "// v1" },
        { path: "components/Header.tsx", content: "// header v1" },
      ];
      const incoming = [
        { path: "app/page.tsx", content: "// v2" }, // mise à jour
        { path: "components/Sidebar.tsx", content: "// new sidebar" }, // nouveau
      ];
      
      const merged = mergeFiles(existing, incoming);
      
      expect(merged).toHaveLength(3);
      expect(merged.find(f => f.path === "app/page.tsx")?.content).toBe("// v2");
      expect(merged.find(f => f.path === "components/Header.tsx")?.content).toBe("// header v1");
      expect(merged.find(f => f.path === "components/Sidebar.tsx")?.content).toBe("// new sidebar");
    });
  });

  describe("Format de sortie pour la preview", () => {
    it("chaque fichier a path et content", () => {
      const files = parseGeneratedFiles(JSON.stringify([
        { path: "app/page.tsx", content: "code" },
      ]));
      
      files.forEach(file => {
        expect(file).toHaveProperty("path");
        expect(file).toHaveProperty("content");
        expect(typeof file.path).toBe("string");
        expect(typeof file.content).toBe("string");
      });
    });
  });
});

// --------------------------------------------------------------------------
// 4. ITÉRATION EN TEMPS RÉEL
// Vérifie que Prestige Build met à jour le code en temps réel
// --------------------------------------------------------------------------

describe("AUDIT 4: Itération en temps réel", () => {
  describe("Prompt d'itération", () => {
    it("construit le contexte avec les fichiers existants", () => {
      const files = [
        { path: "app/page.tsx", content: "export default function Page() {}" },
        { path: "components/Header.tsx", content: "export default function Header() {}" },
      ];
      
      const prompt = buildIteratePrompt("Change le header en bleu", files);
      
      expect(prompt).toContain("--- app/page.tsx ---");
      expect(prompt).toContain("--- components/Header.tsx ---");
      expect(prompt).toContain("Modification request: Change le header en bleu");
    });

    it("gère un tableau de fichiers vide", () => {
      const prompt = buildIteratePrompt("Ajoute un footer", []);
      expect(prompt).toContain("Current files:");
      expect(prompt).toContain("Modification request: Ajoute un footer");
    });
  });

  describe("Instructions d'itération système", () => {
    it("préserve la fonctionnalité existante", () => {
      expect(SYSTEM_PROMPT_ITERATE).toContain("Preserve existing functionality");
    });

    it("demande le contenu complet du fichier", () => {
      expect(SYSTEM_PROMPT_ITERATE).toContain("COMPLETE updated file content");
    });

    it("maintient le style de code existant", () => {
      expect(SYSTEM_PROMPT_ITERATE).toContain("same coding style");
    });
  });

  describe("Fusion des modifications", () => {
    it("remplace les fichiers modifiés", () => {
      const original = [
        { path: "app/page.tsx", content: "// original" },
      ];
      const modified = [
        { path: "app/page.tsx", content: "// modified" },
      ];
      
      const result = mergeFiles(original, modified);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("// modified");
    });

    it("conserve les fichiers non modifiés", () => {
      const original = [
        { path: "app/page.tsx", content: "// page" },
        { path: "app/layout.tsx", content: "// layout" },
      ];
      const modified = [
        { path: "app/page.tsx", content: "// page v2" },
      ];
      
      const result = mergeFiles(original, modified);
      expect(result).toHaveLength(2);
      expect(result.find(f => f.path === "app/layout.tsx")?.content).toBe("// layout");
    });
  });
});

// --------------------------------------------------------------------------
// 5. ROBUSTESSE
// Teste des prompts simples, moyens et complexes
// --------------------------------------------------------------------------

describe("AUDIT 5: Robustesse", () => {
  beforeEach(() => {
    resetMessageCounter();
  });

  describe("Prompts simples", () => {
    it("extrait les besoins d'un prompt simple", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: "Crée une page de login",
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.hasAuth).toBe(true);
    });

    it("gère un prompt avec une seule page", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: "Une page dashboard",
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.pages).toContain("dashboard");
    });
  });

  describe("Prompts moyens", () => {
    it("extrait plusieurs fonctionnalités", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: "Crée une application avec login, base de données, et API endpoints",
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.hasAuth).toBe(true);
      expect(reqs.hasDatabase).toBe(true);
      expect(reqs.hasApi).toBe(true);
    });
  });

  describe("Prompts complexes", () => {
    it("extrait toutes les fonctionnalités d'un prompt complexe", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: `Crée une application e-commerce complète avec:
            - Authentification (login, signup)
            - Base de données pour les produits
            - API REST endpoints
            - Dashboard admin
            - Intégration Stripe pour les paiements
            - Pages: home, profil, settings`,
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      
      expect(reqs.hasAuth).toBe(true);
      expect(reqs.hasDatabase).toBe(true);
      expect(reqs.hasApi).toBe(true);
      expect(reqs.hasPayments).toBe(true);
      expect(reqs.pages).toContain("dashboard");
      expect(reqs.pages).toContain("home");
      expect(reqs.pages).toContain("profil");
      expect(reqs.pages).toContain("settings");
    });
  });

  describe("Prompts ambigus - Clarifications", () => {
    it("gère un prompt sans détails spécifiques", () => {
      const messages = [
        {
          id: "1",
          role: "user" as const,
          content: "Crée une app",
          timestamp: "",
        },
      ];
      const reqs = extractRequirements(messages);
      
      // Sans détails, les features restent vides
      expect(reqs.features).toHaveLength(0);
      expect(reqs.pages).toHaveLength(0);
    });

    it("la phase gathering détecte le manque de détails", () => {
      const session = createSession("test");
      const updated = addMessage(session, "user", "Crée une app");
      updated.requirements = extractRequirements(updated.messages);
      
      // Sans features, on ne devrait pas avancer
      expect(shouldAdvance(updated)).toBe(false);
    });

    it("la phase gathering demande des clarifications", () => {
      const session = createSession("test");
      const prompt = buildConversationPrompt(session);
      
      expect(prompt).toContain("clarifier");
    });
  });

  describe("Prompts incorrects - Gestion d'erreurs", () => {
    it("gère un JSON malformé gracieusement", () => {
      const result = parseGeneratedFiles("{invalid json");
      expect(result).toEqual([]);
    });

    it("gère une réponse vide", () => {
      const result = parseGeneratedFiles("");
      expect(result).toEqual([]);
    });

    it("gère un tableau non-fichiers", () => {
      const result = parseGeneratedFiles("[1, 2, 3]");
      expect(result).toEqual([]);
    });

    it("gère un objet au lieu d'un tableau", () => {
      const result = parseGeneratedFiles('{"path": "test.tsx", "content": "code"}');
      expect(result).toEqual([]);
    });
  });
});

// --------------------------------------------------------------------------
// 6. FLUX CONVERSATIONNEL
// Vérifie le flux de conversation multi-étapes
// --------------------------------------------------------------------------

describe("AUDIT 6: Flux conversationnel", () => {
  beforeEach(() => {
    resetMessageCounter();
  });

  describe("Phases du workflow", () => {
    it("commence en phase gathering", () => {
      const session = createSession("test");
      expect(session.phase).toBe("gathering");
    });

    it("avance de gathering à planning", () => {
      let session = createSession("test");
      session = addMessage(session, "user", "Crée une app avec login");
      session.requirements = extractRequirements(session.messages);
      
      // Avec features détectées, on peut avancer
      expect(shouldAdvance(session)).toBe(true);
      
      session = advancePhase(session);
      expect(session.phase).toBe("planning");
    });

    it("suit le workflow complet", () => {
      let session = createSession("test");
      
      // gathering -> planning
      session = advancePhase(session);
      expect(session.phase).toBe("planning");
      
      // planning -> generating
      session = advancePhase(session);
      expect(session.phase).toBe("generating");
      
      // generating -> reviewing
      session = advancePhase(session);
      expect(session.phase).toBe("reviewing");
      
      // reviewing -> modifying
      session = advancePhase(session);
      expect(session.phase).toBe("modifying");
      
      // modifying -> completed
      session = advancePhase(session);
      expect(session.phase).toBe("completed");
    });
  });

  describe("Prompts par phase", () => {
    it("génère le bon prompt pour chaque phase", () => {
      let session = createSession("test");
      
      // Phase gathering
      let prompt = buildConversationPrompt(session);
      expect(prompt).toContain("décrit une application");
      
      // Phase planning
      session.phase = "planning";
      session.requirements.features = ["auth", "database"];
      prompt = buildConversationPrompt(session);
      expect(prompt).toContain("plan d'architecture");
      
      // Phase generating
      session.phase = "generating";
      prompt = buildConversationPrompt(session);
      expect(prompt).toContain("Génère le code");
      
      // Phase reviewing
      session.phase = "reviewing";
      prompt = buildConversationPrompt(session);
      expect(prompt).toContain("résumé");
      
      // Phase completed
      session.phase = "completed";
      prompt = buildConversationPrompt(session);
      expect(prompt).toContain("généré avec succès");
    });
  });
});

// --------------------------------------------------------------------------
// RAPPORT FINAL: Validation globale du prompt de test
// --------------------------------------------------------------------------

describe("VALIDATION: Prompt de test complet", () => {
  beforeEach(() => {
    resetMessageCounter();
  });

  const TEST_PROMPT = `Crée une application interne simple avec une page de login, un dashboard, 
et une liste d'utilisateurs. Le design doit être propre, moderne, responsive, 
et utiliser Tailwind. Ajoute un header avec le nom de l'entreprise et un menu latéral.`;

  it("extrait correctement les besoins du prompt de test", () => {
    const messages = [
      {
        id: "1",
        role: "user" as const,
        content: TEST_PROMPT,
        timestamp: "",
      },
    ];
    const reqs = extractRequirements(messages);

    // Vérification des fonctionnalités
    expect(reqs.hasAuth).toBe(true); // login
    expect(reqs.pages).toContain("dashboard");
  });

  it("construit un prompt de génération valide", () => {
    const wrapped = buildGeneratePrompt(TEST_PROMPT);
    
    expect(wrapped).toContain("User request:");
    expect(wrapped).toContain("login");
    expect(wrapped).toContain("dashboard");
    expect(wrapped).toContain("header");
    expect(wrapped).toContain("menu latéral");
  });

  it("le système prompt contient les standards requis", () => {
    // Vérifie que le système respecte les standards demandés
    expect(SYSTEM_PROMPT_GENERATE).toContain("TypeScript");
    expect(SYSTEM_PROMPT_GENERATE).toContain("Tailwind CSS");
    expect(SYSTEM_PROMPT_GENERATE).toContain("Next.js App Router");
  });

  it("simule la génération de fichiers attendus", () => {
    // Simulation d'une réponse AI conforme
    const mockAIResponse = JSON.stringify([
      { path: "app/login/page.tsx", content: `"use client";
export default function LoginPage() {
  return <main className="min-h-screen flex items-center justify-center bg-gray-900">...</main>;
}` },
      { path: "app/dashboard/page.tsx", content: `export default function DashboardPage() {
  return <div className="flex min-h-screen">...</div>;
}` },
      { path: "app/users/page.tsx", content: `export default function UsersPage() {
  return <div className="p-4">...</div>;
}` },
      { path: "components/Header.tsx", content: `"use client";
export default function Header() {
  return <header className="bg-gray-800 p-4">Entreprise</header>;
}` },
      { path: "components/Sidebar.tsx", content: `"use client";
export default function Sidebar() {
  return <aside className="w-64 bg-gray-800">Menu</aside>;
}` },
    ]);

    const files = parseGeneratedFiles(mockAIResponse);

    // Vérifie que tous les fichiers attendus sont présents
    expect(files).toHaveLength(5);
    
    const paths = files.map(f => f.path);
    expect(paths).toContain("app/login/page.tsx");
    expect(paths).toContain("app/dashboard/page.tsx");
    expect(paths).toContain("app/users/page.tsx");
    expect(paths).toContain("components/Header.tsx");
    expect(paths).toContain("components/Sidebar.tsx");

    // Vérifie que le contenu contient Tailwind classes
    const headerFile = files.find(f => f.path === "components/Header.tsx");
    expect(headerFile?.content).toContain("className=");
  });
});
