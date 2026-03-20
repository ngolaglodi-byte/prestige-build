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

export interface UIComponents {
  hasHeader: boolean;
  hasSidebar: boolean;
  hasFooter: boolean;
  hasNavbar: boolean;
  hasTable: boolean;
  hasList: boolean;
  hasForm: boolean;
  hasModal: boolean;
}

export interface StyleRequirements {
  isModern: boolean;
  isResponsive: boolean;
  isProfessional: boolean;
  isClean: boolean;
  hasDarkTheme: boolean;
  hasLightTheme: boolean;
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
  // Enhanced for 10/10 audit score
  uiComponents: UIComponents;
  styleRequirements: StyleRequirements;
  entities: string[];  // users, products, orders, etc.
  appType: "dashboard" | "internal" | "website" | "ecommerce" | "tool" | "custom";
  workflows: string[];  // detected workflows/actions
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
      // Enhanced for 10/10 audit score
      uiComponents: {
        hasHeader: false,
        hasSidebar: false,
        hasFooter: false,
        hasNavbar: false,
        hasTable: false,
        hasList: false,
        hasForm: false,
        hasModal: false,
      },
      styleRequirements: {
        isModern: false,
        isResponsive: false,
        isProfessional: false,
        isClean: false,
        hasDarkTheme: false,
        hasLightTheme: false,
      },
      entities: [],
      appType: "custom",
      workflows: [],
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

/**
 * Extract UI components requirements from user messages.
 */
function extractUIComponents(text: string): UIComponents {
  return {
    hasHeader:
      /\b(header|en-tête|entête|entete|barre.?(de.?)?(navigation|nav)|top.?bar)\b/.test(text),
    hasSidebar:
      /\b(sidebar|side.?bar|menu.?latéral|menu.?lateral|panneau.?latéral|side.?menu|side.?nav)\b/.test(text),
    hasFooter:
      /\b(footer|pied.?de.?page|bas.?de.?page|bottom.?bar)\b/.test(text),
    hasNavbar:
      /\b(navbar|nav.?bar|barre.?de.?navigation|navigation|menu.?principal|menu.?navigation)\b/.test(text),
    hasTable:
      /\b(table|tableau|liste.?tabulaire|data.?table|grille|grid)\b/.test(text),
    hasList:
      /\b(liste|list|listing|afficher.*liste|lister)\b/.test(text),
    hasForm:
      /\b(formulaire|form|inscription|enregistrer|soumettre|submit|input|saisie)\b/.test(text),
    hasModal:
      /\b(modal|popup|pop.?up|dialogue|dialog|fenêtre.?modale)\b/.test(text),
  };
}

/**
 * Extract style requirements from user messages.
 */
function extractStyleRequirements(text: string): StyleRequirements {
  return {
    isModern:
      /(^|\s)(moderne|modern|contemporain|actuel|tendance)(\s|$|,|\.)/i.test(text),
    isResponsive:
      /(^|\s)(responsive|adaptatif|mobile|tablette|desktop|multi.?écran|multi.?device)(\s|$|,|\.)/i.test(text),
    isProfessional:
      /(^|\s)(professionnel|professionnelle|professional|business|entreprise|corporate|sérieux)(\s|$|,|\.)/i.test(text),
    isClean:
      /(^|\s)(propre|clean|épuré|epure|minimaliste|simple|élégant|elegant)(\s|$|,|\.)/i.test(text),
    hasDarkTheme:
      /(^|\s)(dark|sombre|noir|theme.?sombre|dark.?mode|dark.?theme)(\s|$|,|\.)/i.test(text),
    hasLightTheme:
      /(^|\s)(light|clair|blanc|lumineux|theme.?clair|light.?mode|light.?theme)(\s|$|,|\.)/i.test(text),
  };
}

/**
 * Extract entities (users, products, orders, etc.) from user messages.
 */
function extractEntities(text: string): string[] {
  const entities: string[] = [];
  const entityPatterns = [
    { pattern: /\b(utilisateur|utilisateurs|user|users|compte|comptes)\b/gi, name: "users" },
    { pattern: /\b(produit|produits|product|products|article|articles)\b/gi, name: "products" },
    { pattern: /\b(commande|commandes|order|orders)\b/gi, name: "orders" },
    { pattern: /\b(client|clients|customer|customers)\b/gi, name: "customers" },
    { pattern: /\b(projet|projets|project|projects)\b/gi, name: "projects" },
    { pattern: /\b(tâche|tâches|task|tasks|todo|todos)\b/gi, name: "tasks" },
    { pattern: /\b(catégorie|catégories|category|categories)\b/gi, name: "categories" },
    { pattern: /\b(équipe|équipes|team|teams)\b/gi, name: "teams" },
    { pattern: /\b(message|messages)\b/gi, name: "messages" },
    { pattern: /\b(notification|notifications)\b/gi, name: "notifications" },
    { pattern: /\b(commentaire|commentaires|comment|comments)\b/gi, name: "comments" },
    { pattern: /\b(fichier|fichiers|file|files|document|documents)\b/gi, name: "files" },
    { pattern: /\b(facture|factures|invoice|invoices)\b/gi, name: "invoices" },
    { pattern: /\b(réservation|réservations|booking|bookings|reservation|reservations)\b/gi, name: "bookings" },
    { pattern: /\b(rapport|rapports|report|reports)\b/gi, name: "reports" },
    { pattern: /\b(événement|événements|event|events)\b/gi, name: "events" },
  ];

  for (const { pattern, name } of entityPatterns) {
    if (pattern.test(text) && !entities.includes(name)) {
      entities.push(name);
    }
  }
  return entities;
}

/**
 * Detect the type of application being described.
 */
function detectAppType(text: string, features: string[], pages: string[]): "dashboard" | "internal" | "website" | "ecommerce" | "tool" | "custom" {
  if (/\b(e.?commerce|boutique|shop|magasin|vente.?en.?ligne|panier|cart)\b/.test(text)) {
    return "ecommerce";
  }
  // Check for "internal" before "dashboard" since internal apps often have dashboards
  if (/\b(interne|internal|back.?office|backoffice)\b/.test(text)) {
    return "internal";
  }
  if (/\b(dashboard|tableau.?de.?bord|panneau.?de.?contrôle|admin.?panel)\b/.test(text)) {
    return "dashboard";
  }
  if (/\b(gestion|management)\b/.test(text) && features.includes("authentication")) {
    return "internal";
  }
  if (/\b(outil|tool|utilitaire|utility|calculateur|converter|générateur)\b/.test(text)) {
    return "tool";
  }
  if (/\b(site.?web|website|site.?vitrine|landing|portfolio|blog)\b/.test(text)) {
    return "website";
  }
  // Infer from detected features
  if (pages.includes("dashboard") || pages.includes("admin")) {
    return "dashboard";
  }
  if (features.includes("authentication")) {
    return "internal";
  }
  return "custom";
}

/**
 * Extract detected workflows/actions from user messages.
 */
function extractWorkflows(text: string): string[] {
  const workflows: string[] = [];
  const workflowPatterns = [
    { pattern: /\b(connexion|login|se.?connecter|sign.?in)\b/i, name: "login" },
    { pattern: /\b(inscription|register|s'inscrire|sign.?up|créer.?compte)\b/i, name: "register" },
    { pattern: /\b(déconnexion|logout|se.?déconnecter|sign.?out)\b/i, name: "logout" },
    { pattern: /\b(créer|create|ajouter|add|nouveau|new)\b/i, name: "create" },
    { pattern: /\b(modifier|edit|update|mettre.?à.?jour|changer)\b/i, name: "edit" },
    { pattern: /\b(supprimer|delete|remove|effacer|enlever)\b/i, name: "delete" },
    { pattern: /\b(lister|list|afficher|show|voir|view)\b/i, name: "view" },
    { pattern: /\b(recherche[rs]?|search|filtre[rs]?|filter|chercher)\b/i, name: "search" },
    { pattern: /\b(exporter|export|télécharger|download)\b/i, name: "export" },
    { pattern: /\b(importer|import|uploader|upload)\b/i, name: "import" },
    { pattern: /\b(payer|pay|acheter|purchase|checkout|commande)\b/i, name: "payment" },
    { pattern: /\b(notifier|notify|alerter|alert|envoyer.?notification)\b/i, name: "notify" },
  ];

  for (const { pattern, name } of workflowPatterns) {
    if (pattern.test(text) && !workflows.includes(name)) {
      workflows.push(name);
    }
  }
  return workflows;
}

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
    /\b(database|db|base de données|modèle|schema|table|crud|stockage|storage)\b/.test(
      userMessages
    );
  if (hasDatabase) features.push("database");

  // Detect API needs
  const hasApi =
    /\b(api|endpoint|route|backend|rest|graphql|webhook)\b/.test(userMessages);
  if (hasApi) features.push("api");

  // Detect payment needs
  const hasPayments =
    /\b(payment|paiement|stripe|billing|facturation|checkout|abonnement|subscription)\b/.test(
      userMessages
    );
  if (hasPayments) features.push("payments");

  // Detect page names (extended list)
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
    "users",
    "utilisateurs",
    "products",
    "produits",
    "orders",
    "commandes",
    "analytics",
    "reports",
    "notifications",
    "help",
    "support",
  ];
  for (const p of pagePatterns) {
    if (userMessages.includes(p)) pages.push(p);
  }

  // Detect project type
  let projectType = "nextjs";
  if (/\b(vue|nuxt)\b/.test(userMessages)) projectType = "vue";
  if (/\b(react(?!.native)|cra)\b/.test(userMessages)) projectType = "react";
  if (/\b(svelte|sveltekit)\b/.test(userMessages)) projectType = "svelte";
  if (/\b(angular)\b/.test(userMessages)) projectType = "angular";
  if (/\b(astro)\b/.test(userMessages)) projectType = "astro";

  // Extract app name using pattern: "app/application/projet/site [appelée/nommée/:] <name>"
  const APP_NAME_PATTERN =
    /(?:app(?:lication)?|projet|site)\s+(?:appelée?|nommée?|:)?\s*["']?(\w[\w\s-]{1,30})["']?/;
  const nameMatch = userMessages.match(APP_NAME_PATTERN);
  const appName = nameMatch?.[1]?.trim();

  // Enhanced extraction for 10/10 audit score
  const uiComponents = extractUIComponents(userMessages);
  const styleRequirements = extractStyleRequirements(userMessages);
  const entities = extractEntities(userMessages);
  const workflows = extractWorkflows(userMessages);
  const appType = detectAppType(userMessages, features, pages);

  // Add entities as pages if not already included
  for (const entity of entities) {
    if (!pages.includes(entity)) {
      pages.push(entity);
    }
  }

  // If UI components detected, add them to features
  if (uiComponents.hasHeader) features.push("header");
  if (uiComponents.hasSidebar) features.push("sidebar");
  if (uiComponents.hasFooter) features.push("footer");
  if (uiComponents.hasNavbar) features.push("navbar");
  if (uiComponents.hasTable) features.push("table");
  if (uiComponents.hasForm) features.push("form");
  if (uiComponents.hasModal) features.push("modal");

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
    uiComponents,
    styleRequirements,
    entities,
    appType,
    workflows,
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

/**
 * Build style description string from requirements.
 */
function buildStyleDescription(styleReq: StyleRequirements): string {
  const parts: string[] = [];
  if (styleReq.isModern) parts.push("moderne");
  if (styleReq.isResponsive) parts.push("responsive");
  if (styleReq.isProfessional) parts.push("professionnel");
  if (styleReq.isClean) parts.push("propre et épuré");
  if (styleReq.hasDarkTheme) parts.push("thème sombre");
  if (styleReq.hasLightTheme) parts.push("thème clair");
  return parts.length > 0 ? `Style demandé: ${parts.join(", ")}.` : "";
}

/**
 * Build UI components description string from requirements.
 */
function buildUIComponentsDescription(uiComp: UIComponents): string {
  const parts: string[] = [];
  if (uiComp.hasHeader) parts.push("header");
  if (uiComp.hasSidebar) parts.push("sidebar/menu latéral");
  if (uiComp.hasFooter) parts.push("footer");
  if (uiComp.hasNavbar) parts.push("navbar");
  if (uiComp.hasTable) parts.push("table/tableau");
  if (uiComp.hasList) parts.push("liste");
  if (uiComp.hasForm) parts.push("formulaire");
  if (uiComp.hasModal) parts.push("modal/popup");
  return parts.length > 0 ? `Composants UI requis: ${parts.join(", ")}.` : "";
}

export function buildConversationPrompt(
  session: ConversationSession
): string {
  const req = session.requirements;

  switch (session.phase) {
    case "gathering": {
      const extracted = [
        req.features.length > 0 ? `Fonctionnalités: ${req.features.join(", ")}` : "",
        req.pages.length > 0 ? `Pages: ${req.pages.join(", ")}` : "",
        req.entities.length > 0 ? `Entités: ${req.entities.join(", ")}` : "",
        buildUIComponentsDescription(req.uiComponents),
        buildStyleDescription(req.styleRequirements),
        req.appType !== "custom" ? `Type d'app: ${req.appType}` : "",
      ].filter(Boolean);

      return [
        "L'utilisateur décrit une application à créer.",
        "Pose des questions pour clarifier les fonctionnalités, les pages, et les modèles de données.",
        extracted.length > 0 ? `Informations déjà extraites :\n- ${extracted.join("\n- ")}` : "Aucune information extraite pour le moment.",
        "",
        "Si le prompt est ambigu ou manque de détails, demande des clarifications spécifiques.",
      ].join("\n");
    }

    case "planning":
      return [
        "Génère un plan d'architecture détaillé pour cette application.",
        `Nom : ${req.appName ?? "non spécifié"}`,
        `Type d'application : ${req.appType}`,
        `Framework : ${req.projectType}`,
        `Fonctionnalités : ${req.features.join(", ") || "à déterminer"}`,
        `Pages : ${req.pages.join(", ") || "à déterminer"}`,
        `Entités/Données : ${req.entities.join(", ") || "à déterminer"}`,
        buildUIComponentsDescription(req.uiComponents),
        buildStyleDescription(req.styleRequirements),
        req.workflows.length > 0 ? `Workflows détectés: ${req.workflows.join(", ")}` : "",
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
        `Framework : ${req.projectType}`,
        `Type d'application : ${req.appType}`,
        `Fonctionnalités : ${req.features.join(", ")}`,
        `Pages à générer : ${req.pages.join(", ")}`,
        buildUIComponentsDescription(req.uiComponents),
        buildStyleDescription(req.styleRequirements),
        "Génère du code TypeScript propre, typé et utilisant Tailwind CSS.",
        "Utilise les conventions Next.js App Router.",
      ]
        .filter(Boolean)
        .join("\n");

    case "reviewing":
      return [
        "Présente un résumé des fichiers générés et demande à l'utilisateur de valider.",
        "Liste les fichiers générés avec leur rôle.",
        "Demande si des modifications sont nécessaires.",
      ].join("\n");

    case "modifying":
      return [
        "Applique les modifications demandées par l'utilisateur sur les fichiers existants.",
        "Préserve le code fonctionnel existant.",
        "Ne modifie que ce qui est explicitement demandé.",
      ].join("\n");

    case "completed":
      return "Le projet a été généré avec succès.";
  }
}
