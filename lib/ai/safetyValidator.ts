// lib/ai/safetyValidator.ts

/**
 * Module de validation de sécurité pour les sorties IA.
 * Empêche les chemins hallucinés, les fichiers invalides
 * et les écrasements non confirmés.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SafetyReport {
  valid: boolean;
  errors: string[];
}

export interface FileAction {
  path: string;
  type: "create" | "update" | "delete";
  content?: string;
}

// ---------------------------------------------------------------------------
// Expressions régulières pour les chemins dangereux
// ---------------------------------------------------------------------------

const DANGEROUS_PATTERNS = [
  /\.\.\//,               // Traversal de répertoire
  /^\/(?!src|app|lib|components|public|pages|styles|hooks|store|utils|config|db|prisma|api)/,  // Chemins absolus hors arborescence projet
  /\0/,                   // Null byte injection
  /[<>"|?*]/,             // Caractères invalides dans les chemins
  /^\s*$/,                // Chemins vides
];

const VALID_EXTENSIONS = new Set([
  // Web
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".html", ".css", ".scss", ".sass", ".less",
  ".json", ".yaml", ".yml", ".toml",
  ".md", ".mdx", ".txt",
  ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp",
  // Config
  ".env", ".env.local", ".env.example",
  ".gitignore", ".eslintrc", ".prettierrc",
  // Mobile
  ".swift", ".kt", ".kts", ".dart",
  // Backend
  ".py", ".go", ".rs", ".rb", ".java",
  // Other
  ".sql", ".graphql", ".gql", ".prisma",
  ".sh", ".bat", ".ps1",
  ".xml", ".csv",
  ".dockerfile", ".dockerignore",
  ".lock",
]);

// Fichiers sans extension autorisés
const VALID_EXTENSIONLESS_FILES = new Set([
  "Dockerfile",
  "Makefile",
  "Procfile",
  "Gemfile",
  "Rakefile",
  ".gitignore",
  ".dockerignore",
  ".env",
  ".env.local",
  ".env.example",
  ".eslintrc",
  ".prettierrc",
  "LICENSE",
  "README",
]);

// ---------------------------------------------------------------------------
// Validation de chemin
// ---------------------------------------------------------------------------

export function validatePath(path: string): string[] {
  const errors: string[] = [];

  if (!path || typeof path !== "string") {
    errors.push("Chemin de fichier manquant ou invalide.");
    return errors;
  }

  const trimmed = path.trim();

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      errors.push(
        `Chemin dangereux détecté : "${trimmed}" correspond au pattern ${pattern}`
      );
    }
  }

  // Vérifier l'extension
  const fileName = trimmed.split("/").pop() ?? "";
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex === -1) {
    // Pas d'extension — vérifier si c'est un fichier connu
    if (!VALID_EXTENSIONLESS_FILES.has(fileName)) {
      errors.push(
        `Fichier sans extension non reconnu : "${fileName}". Ajoutez une extension valide.`
      );
    }
  } else {
    const ext = fileName.slice(dotIndex).toLowerCase();
    if (!VALID_EXTENSIONS.has(ext)) {
      errors.push(
        `Extension non supportée : "${ext}" pour le fichier "${trimmed}".`
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Validation de contenu
// ---------------------------------------------------------------------------

export function validateContent(content: string | undefined): string[] {
  const errors: string[] = [];

  if (content === undefined || content === null) {
    errors.push("Contenu du fichier manquant.");
    return errors;
  }

  if (typeof content !== "string") {
    errors.push("Le contenu du fichier doit être une chaîne de caractères.");
    return errors;
  }

  // Contenu vide (avertissement, pas une erreur bloquante)
  // On le garde quand même valide car certains fichiers peuvent être vides

  return errors;
}

// ---------------------------------------------------------------------------
// Détection de conflits (écrasement)
// ---------------------------------------------------------------------------

export function detectOverwrites(
  actions: FileAction[],
  existingFiles: string[]
): string[] {
  const existingSet = new Set(existingFiles);
  const warnings: string[] = [];

  for (const action of actions) {
    if (action.type === "create" && existingSet.has(action.path)) {
      warnings.push(
        `Le fichier "${action.path}" existe déjà et serait écrasé. Confirmation requise.`
      );
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Validation complète d'un ensemble d'actions
// ---------------------------------------------------------------------------

export function validateActions(
  actions: FileAction[],
  existingFiles: string[] = []
): SafetyReport {
  const allErrors: string[] = [];

  for (const action of actions) {
    const pathErrors = validatePath(action.path);
    allErrors.push(...pathErrors);

    if (action.type === "create" || action.type === "update") {
      const contentErrors = validateContent(action.content);
      allErrors.push(...contentErrors);
    }
  }

  // Vérifier les conflits d'écrasement
  const overwrites = detectOverwrites(actions, existingFiles);
  allErrors.push(...overwrites);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
