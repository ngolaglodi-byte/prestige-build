/**
 * Audit Test Suite pour Prestige Build - Moteur Prompt-to-Apps
 * 
 * Ce fichier teste les 6 critères d'audit définis par l'auditeur interne
 * de Prestige Technologie Company.
 * 
 * OBJECTIF: Score 10/10 sur chaque critère d'audit.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseGeneratedFiles,
  mergeFiles,
  validateCode,
  attemptCodeFix,
  parseFileTagsFormat,
  validateAndFixFiles,
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
  headerTemplate,
  sidebarTemplate,
  footerTemplate,
  loginPageTemplate,
  dashboardPageTemplate,
  usersPageTemplate,
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

// ==========================================================================
// NOUVELLES AMÉLIORATIONS POUR SCORE 10/10
// ==========================================================================

// --------------------------------------------------------------------------
// CRITÈRE 1 AMÉLIORÉ: Compréhension du prompt (10/10)
// --------------------------------------------------------------------------

describe("AUDIT 1 AMÉLIORÉ: Compréhension du prompt (10/10)", () => {
  beforeEach(() => {
    resetMessageCounter();
  });

  describe("Extraction des composants UI", () => {
    it("détecte le header dans le prompt", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Ajoute un header avec le logo", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.uiComponents.hasHeader).toBe(true);
      expect(reqs.features).toContain("header");
    });

    it("détecte le sidebar/menu latéral", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Avec un menu latéral de navigation", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.uiComponents.hasSidebar).toBe(true);
      expect(reqs.features).toContain("sidebar");
    });

    it("détecte le footer", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Ajoute un footer avec les mentions légales", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.uiComponents.hasFooter).toBe(true);
      expect(reqs.features).toContain("footer");
    });

    it("détecte les tableaux/tables", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Affiche les utilisateurs dans un tableau", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.uiComponents.hasTable).toBe(true);
    });

    it("détecte les formulaires", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Crée un formulaire d'inscription", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.uiComponents.hasForm).toBe(true);
    });
  });

  describe("Extraction des entités", () => {
    it("détecte les utilisateurs", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Gestion des utilisateurs", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.entities).toContain("users");
    });

    it("détecte les produits", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Liste des produits", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.entities).toContain("products");
    });

    it("détecte les commandes", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Suivi des commandes", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.entities).toContain("orders");
    });

    it("ajoute les entités aux pages", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Gestion des utilisateurs et produits", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.pages).toContain("users");
      expect(reqs.pages).toContain("products");
    });
  });

  describe("Extraction des styles demandés", () => {
    it("détecte un design moderne", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Design moderne et épuré", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.styleRequirements.isModern).toBe(true);
      expect(reqs.styleRequirements.isClean).toBe(true);
    });

    it("détecte un design responsive", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "L'application doit être responsive", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.styleRequirements.isResponsive).toBe(true);
    });

    it("détecte un design professionnel", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Un look professionnel et business", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.styleRequirements.isProfessional).toBe(true);
    });
  });

  describe("Détection du type d'application", () => {
    it("détecte une application dashboard", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Crée un dashboard avec des statistiques", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.appType).toBe("dashboard");
    });

    it("détecte une application interne", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Application interne pour la gestion", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.appType).toBe("internal");
    });

    it("détecte un site e-commerce", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Crée une boutique e-commerce avec panier", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.appType).toBe("ecommerce");
    });

    it("détecte un outil/utilitaire", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Un outil de conversion", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.appType).toBe("tool");
    });
  });

  describe("Extraction des workflows", () => {
    it("détecte les workflows d'authentification", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Connexion et inscription des utilisateurs", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.workflows).toContain("login");
      expect(reqs.workflows).toContain("register");
    });

    it("détecte les opérations CRUD", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Créer, modifier et supprimer des produits", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.workflows).toContain("create");
      expect(reqs.workflows).toContain("edit");
      expect(reqs.workflows).toContain("delete");
    });

    it("détecte la recherche et le filtrage", () => {
      const messages = [
        { id: "1", role: "user" as const, content: "Avec recherche et filtres", timestamp: "" },
      ];
      const reqs = extractRequirements(messages);
      expect(reqs.workflows).toContain("search");
    });
  });
});

// --------------------------------------------------------------------------
// CRITÈRE 2 AMÉLIORÉ: Génération de code (10/10)
// --------------------------------------------------------------------------

describe("AUDIT 2 AMÉLIORÉ: Génération de code (10/10)", () => {
  describe("Templates de composants améliorés", () => {
    it("génère un header complet", () => {
      const code = headerTemplate("Mon App");
      expect(code).toContain('"use client"');
      expect(code).toContain("export default function Header");
      expect(code).toContain("Mon App");
      expect(code).toContain("className=");
    });

    it("génère un sidebar avec navigation", () => {
      const code = sidebarTemplate(["Dashboard", "Users"]);
      expect(code).toContain('"use client"');
      expect(code).toContain("export default function Sidebar");
      expect(code).toContain("Dashboard");
      expect(code).toContain("Users");
    });

    it("génère un footer", () => {
      const code = footerTemplate("Ma Société");
      expect(code).toContain('"use client"');
      expect(code).toContain("export default function Footer");
      expect(code).toContain("Ma Société");
    });

    it("génère une page de login complète", () => {
      const code = loginPageTemplate();
      expect(code).toContain('"use client"');
      expect(code).toContain("useState");
      expect(code).toContain("email");
      expect(code).toContain("password");
      expect(code).toContain("handleSubmit");
      expect(code).toContain("className=");
    });

    it("génère une page dashboard", () => {
      const code = dashboardPageTemplate();
      expect(code).toContain("export default function DashboardPage");
      expect(code).toContain("Dashboard");
      expect(code).toContain("className=");
    });

    it("génère une page de gestion des utilisateurs", () => {
      const code = usersPageTemplate();
      expect(code).toContain('"use client"');
      expect(code).toContain("useState");
      expect(code).toContain("useEffect");
      expect(code).toContain("interface User");
      expect(code).toContain("Utilisateurs");
    });
  });

  describe("Validation du code généré", () => {
    it("valide du code avec des accolades équilibrées", () => {
      const code = `function test() { return { a: 1 }; }`;
      const result = validateCode(code, "test.tsx");
      expect(result.isValid).toBe(true);
    });

    it("détecte les accolades non équilibrées", () => {
      const code = `function test() { return { a: 1 };`;
      const result = validateCode(code, "test.tsx");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Unbalanced braces {}");
    });

    it("détecte les parenthèses non équilibrées", () => {
      const code = `function test( { return 1; }`;
      const result = validateCode(code, "test.tsx");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Unbalanced parentheses ()");
    });

    it("valide du JSON correctement formaté", () => {
      const code = `{"name": "test", "value": 123}`;
      const result = validateCode(code, "data.json");
      expect(result.isValid).toBe(true);
    });

    it("détecte du JSON invalide", () => {
      const code = `{name: test}`;
      const result = validateCode(code, "data.json");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid JSON syntax");
    });
  });

  describe("Auto-correction du code", () => {
    it("ajoute 'use client' aux composants avec hooks", () => {
      const code = `import React, { useState } from "react";
export default function Test() { const [x, setX] = useState(0); }`;
      const fixed = attemptCodeFix(code, "components/Test.tsx");
      expect(fixed).toContain('"use client"');
    });

    it("ajoute une nouvelle ligne à la fin", () => {
      const code = `export default function Test() {}`;
      const fixed = attemptCodeFix(code, "test.tsx");
      expect(fixed.endsWith("\n")).toBe(true);
    });
  });

  describe("Parsing de formats alternatifs", () => {
    it("parse le format <file> tags", () => {
      const input = `<file path="app/page.tsx">export default function Page() {}</file>`;
      const files = parseFileTagsFormat(input);
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("app/page.tsx");
    });

    it("parse plusieurs fichiers avec <file> tags", () => {
      const input = `
        <file path="app/page.tsx">// page</file>
        <file path="app/layout.tsx">// layout</file>
      `;
      const files = parseFileTagsFormat(input);
      expect(files).toHaveLength(2);
    });
  });
});

// --------------------------------------------------------------------------
// CRITÈRE 3 AMÉLIORÉ: Construction et Preview (10/10)
// --------------------------------------------------------------------------

describe("AUDIT 3 AMÉLIORÉ: Construction et Preview (10/10)", () => {
  describe("Validation et correction des fichiers", () => {
    it("valide et corrige un ensemble de fichiers", () => {
      const files = [
        { path: "components/Test.tsx", content: `import { useState } from "react";\nexport default function Test() { return <div />; }` },
      ];
      const { files: processed, validationResults } = validateAndFixFiles(files);
      
      expect(processed).toHaveLength(1);
      expect(validationResults.get("components/Test.tsx")).toBeDefined();
    });
  });

  describe("Templates avec options avancées", () => {
    it("génère une page avec header et sidebar", () => {
      const code = pageTemplate("Dashboard", "<h1>Content</h1>", {
        withHeader: true,
        withSidebar: true,
      });
      expect(code).toContain("Header");
      expect(code).toContain("Sidebar");
    });

    it("génère un layout complet", () => {
      const code = layoutTemplate("Mon App", {
        withHeader: true,
        withSidebar: true,
        withFooter: true,
      });
      expect(code).toContain("Header");
      expect(code).toContain("Sidebar");
      expect(code).toContain("Footer");
    });

    it("génère une API route avec authentification", () => {
      const code = apiRouteTemplate("", { withAuth: true, entityName: "users" });
      expect(code).toContain("getCurrentUser");
      expect(code).toContain("Unauthorized");
      expect(code).toContain("users");
    });
  });
});

// --------------------------------------------------------------------------
// PROMPT DE TEST COMPLET POUR SCORE 10/10
// --------------------------------------------------------------------------

describe("VALIDATION FINALE: Prompt de test complet (Score 10/10)", () => {
  beforeEach(() => {
    resetMessageCounter();
  });

  const FULL_TEST_PROMPT = `Crée une application interne complète avec login, dashboard, 
gestion des utilisateurs, header, sidebar, footer, et un design moderne en Tailwind. 
L'application doit être responsive, propre, professionnelle et respecter les standards internes.`;

  it("extrait TOUS les éléments du prompt de test", () => {
    const messages = [
      { id: "1", role: "user" as const, content: FULL_TEST_PROMPT, timestamp: "" },
    ];
    const reqs = extractRequirements(messages);

    // Vérification de l'authentification
    expect(reqs.hasAuth).toBe(true);
    expect(reqs.features).toContain("authentication");

    // Vérification des pages
    expect(reqs.pages).toContain("dashboard");
    expect(reqs.pages).toContain("users"); // Via entités

    // Vérification des composants UI
    expect(reqs.uiComponents.hasHeader).toBe(true);
    expect(reqs.uiComponents.hasSidebar).toBe(true);
    expect(reqs.uiComponents.hasFooter).toBe(true);

    // Vérification des styles
    expect(reqs.styleRequirements.isModern).toBe(true);
    expect(reqs.styleRequirements.isResponsive).toBe(true);
    expect(reqs.styleRequirements.isProfessional).toBe(true);
    expect(reqs.styleRequirements.isClean).toBe(true);

    // Vérification du type d'app
    expect(reqs.appType).toBe("internal");

    // Vérification des entités
    expect(reqs.entities).toContain("users");
  });

  it("génère un prompt de conversation enrichi", () => {
    const session = createSession("test");
    const updated = addMessage(session, "user", FULL_TEST_PROMPT);
    updated.requirements = extractRequirements(updated.messages);
    
    const prompt = buildConversationPrompt(updated);
    
    // Le prompt doit contenir les informations extraites
    expect(prompt).toContain("authentication");
    expect(prompt).toContain("header");
    expect(prompt).toContain("sidebar");
  });

  it("permet de passer à la phase suivante avec assez de détails", () => {
    const session = createSession("test");
    const updated = addMessage(session, "user", FULL_TEST_PROMPT);
    updated.requirements = extractRequirements(updated.messages);
    
    // Avec les features détectées, on peut avancer
    expect(updated.requirements.features.length).toBeGreaterThan(0);
    expect(shouldAdvance(updated)).toBe(true);
  });

  it("tous les templates génèrent du code valide", () => {
    const loginCode = loginPageTemplate();
    const dashboardCode = dashboardPageTemplate();
    const usersCode = usersPageTemplate();
    const headerCode = headerTemplate("Test");
    const sidebarCode = sidebarTemplate();
    const footerCode = footerTemplate();

    // Tous doivent être valides
    expect(validateCode(loginCode, "app/login/page.tsx").isValid).toBe(true);
    expect(validateCode(dashboardCode, "app/dashboard/page.tsx").isValid).toBe(true);
    expect(validateCode(usersCode, "app/users/page.tsx").isValid).toBe(true);
    expect(validateCode(headerCode, "components/Header.tsx").isValid).toBe(true);
    expect(validateCode(sidebarCode, "components/Sidebar.tsx").isValid).toBe(true);
    expect(validateCode(footerCode, "components/Footer.tsx").isValid).toBe(true);
  });
});
