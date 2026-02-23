import { AIProvider, type AIModel, type GenerateOptions } from "./provider";
import { estimateComplexity } from "./complexity";
import { tokenRules } from "./tokenRules";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrchestrationAction =
  | "generate"
  | "generate_multi"
  | "refactor"
  | "explain"
  | "fix"
  | "create_project";

export interface OrchestrationRequest {
  /** Action demandée */
  action: OrchestrationAction;
  /** Prompt utilisateur */
  prompt: string;
  /** Code du fichier actif (optionnel) */
  code?: string;
  /** Chemin du fichier actif (optionnel) */
  filePath?: string;
  /** Contexte du projet — liste de chemins existants */
  projectFiles?: string[];
  /** Type de projet (nextjs, react, vue, etc.) */
  projectType?: string;
  /** Modèle IA préféré */
  model?: AIModel;
  /** Erreurs à corriger (pour action "fix") */
  errors?: string[];
}

export interface OrchestrationResult {
  /** Texte brut renvoyé par l'IA */
  result: string;
  /** Modèle effectivement utilisé */
  model: AIModel;
  /** Complexité détectée */
  complexity: string;
  /** Tokens maximum alloués */
  maxTokens: number;
  /** Crédits consommés */
  creditCost: number;
}

// ---------------------------------------------------------------------------
// Prompt système principal (français par défaut)
// ---------------------------------------------------------------------------

const BASE_SYSTEM_PROMPT = [
  "Tu es un ingénieur logiciel senior expert, intégré à la plateforme Prestige Build.",
  "Tu maîtrises tous les langages et frameworks modernes : TypeScript, JavaScript, Python, Go, Swift, Kotlin, Rust, etc.",
  "Tu génères du code propre, bien structuré, typé et prêt pour la production.",
  "Toutes tes réponses sont en français.",
  "Utilise les bonnes pratiques : typage strict, composants fonctionnels, gestion d'erreurs, accessibilité.",
  "Ajoute des commentaires concis en français uniquement quand la logique est complexe.",
  "Si la demande est ambiguë, génère la solution la plus probable et ajoute un bref commentaire expliquant ton choix.",
  "Ne répète jamais le code existant inutilement — fournis uniquement les modifications ou ajouts nécessaires.",
  "N'invente jamais de chemins de fichiers qui n'existent pas dans le projet.",
  "Ne génère pas de fichiers invalides ou incomplets.",
  "Quand tu génères plusieurs fichiers, utilise le format suivant pour chaque fichier :",
  '  <file path="chemin/du/fichier.ext">',
  "  contenu du fichier",
  "  </file>",
].join("\n");

// ---------------------------------------------------------------------------
// Prompts spécialisés par action
// ---------------------------------------------------------------------------

function buildActionPrompt(req: OrchestrationRequest): string {
  const parts: string[] = [];

  switch (req.action) {
    case "generate":
      parts.push(
        "Génère un fichier complet et fonctionnel selon les instructions de l'utilisateur."
      );
      break;
    case "generate_multi":
      parts.push(
        "Génère plusieurs fichiers complets pour le projet.",
        "Utilise le format <file path=\"...\">contenu</file> pour chaque fichier."
      );
      break;
    case "refactor":
      parts.push(
        "Refactorise le code fourni en améliorant la lisibilité, les performances et les bonnes pratiques.",
        "Explique brièvement les changements effectués."
      );
      break;
    case "explain":
      parts.push(
        "Explique le code fourni de manière claire et pédagogique en français.",
        "Décris l'architecture, les patterns utilisés et le flux de données."
      );
      break;
    case "fix":
      parts.push(
        "Corrige les erreurs dans le code fourni.",
        "Explique brièvement chaque correction effectuée."
      );
      if (req.errors?.length) {
        parts.push("Erreurs signalées :", ...req.errors.map((e) => `  - ${e}`));
      }
      break;
    case "create_project":
      parts.push(
        "Génère la structure complète d'un projet selon le type demandé.",
        "Utilise le format <file path=\"...\">contenu</file> pour chaque fichier.",
        `Type de projet : ${req.projectType ?? "non spécifié"}`
      );
      break;
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Construction du prompt utilisateur avec contexte
// ---------------------------------------------------------------------------

function buildUserPrompt(req: OrchestrationRequest): string {
  const sections: string[] = [];

  // Contexte projet
  if (req.projectFiles?.length) {
    sections.push(
      "Fichiers existants dans le projet :",
      ...req.projectFiles.map((f) => `  - ${f}`),
      ""
    );
  }

  // Fichier actif
  if (req.filePath) {
    sections.push(`Fichier actif : ${req.filePath}`);
  }

  // Code courant
  if (req.code) {
    sections.push("Code actuel :", "```", req.code, "```", "");
  }

  // Prompt utilisateur
  sections.push("Demande :", req.prompt);

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Orchestrateur principal
// ---------------------------------------------------------------------------

const provider = new AIProvider();

export async function orchestrate(
  req: OrchestrationRequest
): Promise<OrchestrationResult> {
  const complexity = estimateComplexity(req.prompt, req.code ?? "");
  const { maxTokens, creditCost } = tokenRules[complexity];

  const systemPrompt = [
    BASE_SYSTEM_PROMPT,
    "",
    buildActionPrompt(req),
  ].join("\n");

  const userPrompt = buildUserPrompt(req);

  const preferredModel: AIModel =
    req.model ?? provider.resolveModel("gpt");

  const options: GenerateOptions = { maxTokens, systemPrompt };

  // Tentative avec fallback et retry (récupération d'erreurs)
  const { result, model } = await provider.generateWithFallback(
    preferredModel,
    userPrompt,
    options
  );

  return {
    result,
    model,
    complexity,
    maxTokens,
    creditCost,
  };
}

export { provider };
