/**
 * Conversational flow — Chat → App generation pipeline.
 *
 * Manages multi-turn conversations where users describe applications
 * in natural language, and the system progressively generates the
 * corresponding project structure (DB, Auth, UI, API, routing).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConversationRole = "user" | "assistant" | "system";

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type ConversationPhase =
  | "gathering"     // Collecting requirements
  | "planning"      // Building the architecture plan
  | "generating"    // Generating files
  | "reviewing"     // Asking user to review
  | "modifying"     // Applying modifications
  | "completed";    // Done

export interface ConversationSession {
  id: string;
  projectId: string;
  phase: ConversationPhase;
  messages: ConversationMessage[];
  requirements: AppRequirements;
  createdAt: string;
  updatedAt: string;
}

export interface AppRequirements {
  appName?: string;
  description?: string;
  features: string[];
  hasAuth: boolean;
  hasDatabase: boolean;
  hasApi: boolean;
  hasPayments: boolean;
  projectType: string;
  pages: string[];
  dataModels: DataModel[];
}

export interface DataModel {
  name: string;
  fields: Array<{ name: string; type: string; required: boolean }>;
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

let msgCounter = 0;
export function nextMessageId(): string {
  return `msg_${++msgCounter}`;
}
export function resetMessageCounter(): void {
  msgCounter = 0;
}

export function createSession(projectId: string): ConversationSession {
  return {
    id: crypto.randomUUID(),
    projectId,
    phase: "gathering",
    messages: [],
    requirements: {
      features: [],
      hasAuth: false,
      hasDatabase: false,
      hasApi: false,
      hasPayments: false,
      projectType: "nextjs",
      pages: [],
      dataModels: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function addMessage(
  session: ConversationSession,
  role: ConversationRole,
  content: string,
  metadata?: Record<string, unknown>
): ConversationSession {
  const message: ConversationMessage = {
    id: nextMessageId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    metadata,
  };
  return {
    ...session,
    messages: [...session.messages, message],
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Requirement extraction from user messages
// ---------------------------------------------------------------------------

export function extractRequirements(
  messages: ConversationMessage[]
): AppRequirements {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  const features: string[] = [];
  const pages: string[] = [];
  const dataModels: DataModel[] = [];

  // Detect authentication needs
  const hasAuth =
    /\b(auth|login|connexion|inscription|signup|sign.?up|sign.?in|register)\b/.test(
      userMessages
    );
  if (hasAuth) features.push("authentication");

  // Detect database needs
  const hasDatabase =
    /\b(database|db|base de données|modèle|schema|table|crud)\b/.test(
      userMessages
    );
  if (hasDatabase) features.push("database");

  // Detect API needs
  const hasApi =
    /\b(api|endpoint|route|backend|rest|graphql)\b/.test(userMessages);
  if (hasApi) features.push("api");

  // Detect payment needs
  const hasPayments =
    /\b(payment|paiement|stripe|billing|facturation|checkout|abonnement|subscription)\b/.test(
      userMessages
    );
  if (hasPayments) features.push("payments");

  // Detect page names
  const pagePatterns = [
    "dashboard",
    "accueil",
    "home",
    "profil",
    "profile",
    "settings",
    "paramètres",
    "contact",
    "about",
    "pricing",
    "blog",
    "admin",
  ];
  for (const p of pagePatterns) {
    if (userMessages.includes(p)) pages.push(p);
  }

  // Detect project type
  let projectType = "nextjs";
  if (/\b(vue|nuxt)\b/.test(userMessages)) projectType = "vue";
  if (/\b(react(?!.native)|cra)\b/.test(userMessages)) projectType = "react";
  if (/\b(svelte|sveltekit)\b/.test(userMessages)) projectType = "svelte";

  // Extract app name using pattern: "app/application/projet/site [appelée/nommée/:] <name>"
  const APP_NAME_PATTERN =
    /(?:app(?:lication)?|projet|site)\s+(?:appelée?|nommée?|:)?\s*["']?(\w[\w\s-]{1,30})["']?/;
  const nameMatch = userMessages.match(APP_NAME_PATTERN);
  const appName = nameMatch?.[1]?.trim();

  return {
    appName,
    description: userMessages.slice(0, 200),
    features,
    hasAuth,
    hasDatabase,
    hasApi,
    hasPayments,
    projectType,
    pages,
    dataModels,
  };
}

// ---------------------------------------------------------------------------
// Phase transitions
// ---------------------------------------------------------------------------

export function advancePhase(session: ConversationSession): ConversationSession {
  const phaseOrder: ConversationPhase[] = [
    "gathering",
    "planning",
    "generating",
    "reviewing",
    "modifying",
    "completed",
  ];
  const idx = phaseOrder.indexOf(session.phase);
  const next = idx < phaseOrder.length - 1 ? phaseOrder[idx + 1] : session.phase;
  return { ...session, phase: next, updatedAt: new Date().toISOString() };
}

export function shouldAdvance(session: ConversationSession): boolean {
  const userMsgCount = session.messages.filter((m) => m.role === "user").length;

  switch (session.phase) {
    case "gathering":
      // Advance after at least 1 user message that provides enough detail
      return userMsgCount >= 1 && session.requirements.features.length > 0;
    case "planning":
      return true; // Plan generated — move to generating
    case "generating":
      return true; // Code generated — move to review
    case "reviewing":
      // Advance when user confirms
      return session.messages.some(
        (m) =>
          m.role === "user" &&
          /\b(ok|oui|yes|confirme|valide|parfait|bien|good)\b/i.test(m.content)
      );
    case "modifying":
      return true;
    case "completed":
      return false;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Build prompt for AI based on current phase
// ---------------------------------------------------------------------------

export function buildConversationPrompt(
  session: ConversationSession
): string {
  const req = session.requirements;

  switch (session.phase) {
    case "gathering":
      return [
        "L'utilisateur décrit une application à créer.",
        "Pose des questions pour clarifier les fonctionnalités, les pages, et les modèles de données.",
        `Informations déjà extraites : ${JSON.stringify(req)}`,
      ].join("\n");

    case "planning":
      return [
        "Génère un plan d'architecture détaillé pour cette application.",
        `Nom : ${req.appName ?? "non spécifié"}`,
        `Type : ${req.projectType}`,
        `Fonctionnalités : ${req.features.join(", ")}`,
        `Pages : ${req.pages.join(", ") || "à déterminer"}`,
        req.hasAuth ? "Inclure l'authentification." : "",
        req.hasDatabase ? "Inclure la base de données." : "",
        req.hasApi ? "Inclure des API routes." : "",
        req.hasPayments ? "Inclure l'intégration de paiements." : "",
        "Retourne le plan sous forme de liste structurée.",
      ]
        .filter(Boolean)
        .join("\n");

    case "generating":
      return [
        "Génère le code complet de l'application selon le plan validé.",
        'Utilise le format <file path="chemin/du/fichier">contenu</file> pour chaque fichier.',
        `Type de projet : ${req.projectType}`,
        `Fonctionnalités : ${req.features.join(", ")}`,
      ].join("\n");

    case "reviewing":
      return "Présente un résumé des fichiers générés et demande à l'utilisateur de valider.";

    case "modifying":
      return "Applique les modifications demandées par l'utilisateur sur les fichiers existants.";

    case "completed":
      return "Le projet a été généré avec succès.";
  }
}
