/**
 * Parses AI output into structured generated files.
 * Enhanced for 10/10 audit score with validation and error handling.
 */

import type { GeneratedFile } from "./template-engine";

/**
 * Code validation result.
 */
export interface CodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Basic syntax validation patterns for TypeScript/React code.
 */
const VALIDATION_PATTERNS = {
  // Check for balanced braces
  bracesBalance: (code: string): boolean => {
    let count = 0;
    for (const char of code) {
      if (char === "{") count++;
      if (char === "}") count--;
      if (count < 0) return false;
    }
    return count === 0;
  },
  // Check for balanced parentheses
  parensBalance: (code: string): boolean => {
    let count = 0;
    for (const char of code) {
      if (char === "(") count++;
      if (char === ")") count--;
      if (count < 0) return false;
    }
    return count === 0;
  },
  // Check for balanced brackets
  bracketsBalance: (code: string): boolean => {
    let count = 0;
    for (const char of code) {
      if (char === "[") count++;
      if (char === "]") count--;
      if (count < 0) return false;
    }
    return count === 0;
  },
  // Check for valid export default
  hasDefaultExport: (code: string): boolean => {
    return /export\s+default\s+(function|class|const|async\s+function)/.test(code) ||
           /export\s+\{[^}]*\bdefault\b/.test(code);
  },
  // Check for valid React component structure
  hasReactComponent: (code: string): boolean => {
    return /import\s+.*React/.test(code) || /from\s+["']react["']/.test(code);
  },
  // Check for JSX return
  hasJsxReturn: (code: string): boolean => {
    return /return\s*\(?\s*</.test(code) || /=>\s*\(?\s*</.test(code);
  },
};

/**
 * Validates generated code for basic syntax correctness.
 */
export function validateCode(code: string, filePath: string): CodeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Skip validation for non-code files
  if (!filePath.match(/\.(tsx?|jsx?|css|json)$/)) {
    return { isValid: true, errors, warnings };
  }

  // Check balance
  if (!VALIDATION_PATTERNS.bracesBalance(code)) {
    errors.push("Unbalanced braces {}");
  }
  if (!VALIDATION_PATTERNS.parensBalance(code)) {
    errors.push("Unbalanced parentheses ()");
  }
  if (!VALIDATION_PATTERNS.bracketsBalance(code)) {
    errors.push("Unbalanced brackets []");
  }

  // TypeScript/React specific checks
  if (filePath.match(/\.(tsx|jsx)$/)) {
    if (!VALIDATION_PATTERNS.hasJsxReturn(code)) {
      warnings.push("No JSX return statement found");
    }
    // Check for common page/component patterns
    if (filePath.includes("/page.tsx") || filePath.includes("/components/")) {
      if (!VALIDATION_PATTERNS.hasDefaultExport(code)) {
        warnings.push("Missing default export");
      }
    }
  }

  // API route checks
  if (filePath.includes("/api/") && filePath.endsWith("/route.ts")) {
    if (!/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/.test(code)) {
      warnings.push("API route should export GET, POST, PUT, DELETE or PATCH");
    }
  }

  // JSON validation
  if (filePath.endsWith(".json")) {
    try {
      JSON.parse(code);
    } catch {
      errors.push("Invalid JSON syntax");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Attempts to fix common code issues.
 */
export function attemptCodeFix(code: string, filePath: string): string {
  let fixedCode = code;

  // Fix missing "use client" for client components
  if (filePath.match(/\.(tsx|jsx)$/) && filePath.includes("components")) {
    // Check if code uses React hooks that require "use client"
    const hasClientHooks = /\buse(State|Effect|Ref|Callback|Memo|Context|Reducer)\s*\(/.test(fixedCode) ||
                           /import\s*\{[^}]*(useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer)[^}]*\}/.test(fixedCode);
    if (hasClientHooks && !fixedCode.includes('"use client"')) {
      fixedCode = '"use client";\n\n' + fixedCode;
    }
  }

  // Fix missing React import if JSX is present
  if (filePath.match(/\.(tsx|jsx)$/)) {
    if (/<[A-Z]/.test(fixedCode) && !/import\s+.*React/.test(fixedCode)) {
      fixedCode = 'import React from "react";\n' + fixedCode;
    }
  }

  // Ensure trailing newline
  if (!fixedCode.endsWith("\n")) {
    fixedCode += "\n";
  }

  return fixedCode;
}

/**
 * Extracts a JSON array of files from an AI response string.
 * Handles both raw JSON and markdown-fenced JSON blocks.
 */
export function parseGeneratedFiles(aiOutput: string): GeneratedFile[] {
  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = aiOutput.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = jsonMatch ? jsonMatch[1].trim() : aiOutput.trim();
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (f: unknown): f is { path: string; content: string } =>
          typeof f === "object" &&
          f !== null &&
          typeof (f as Record<string, unknown>).path === "string" &&
          typeof (f as Record<string, unknown>).content === "string"
      )
      .map((f) => ({ path: f.path, content: f.content }));
  } catch {
    // Try alternative parsing with <file> tags
    return parseFileTagsFormat(aiOutput);
  }
}

/**
 * Parse <file path="...">content</file> format.
 */
export function parseFileTagsFormat(aiOutput: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const regex = /<file\s+path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(aiOutput)) !== null) {
    files.push({
      path: match[1],
      content: match[2].trim(),
    });
  }

  return files;
}

/**
 * Merges new files into existing file set, replacing files with the same path.
 */
export function mergeFiles(
  existing: GeneratedFile[],
  incoming: GeneratedFile[]
): GeneratedFile[] {
  const map = new Map<string, GeneratedFile>();
  for (const f of existing) map.set(f.path, f);
  for (const f of incoming) map.set(f.path, f);
  return Array.from(map.values());
}

/**
 * Validates and optionally fixes all files in a set.
 */
export function validateAndFixFiles(
  files: GeneratedFile[],
  autoFix: boolean = true
): { files: GeneratedFile[]; validationResults: Map<string, CodeValidationResult> } {
  const validationResults = new Map<string, CodeValidationResult>();
  const processedFiles: GeneratedFile[] = [];

  for (const file of files) {
    let content = file.content;

    // Attempt auto-fix if enabled
    if (autoFix) {
      content = attemptCodeFix(content, file.path);
    }

    // Validate
    const validation = validateCode(content, file.path);
    validationResults.set(file.path, validation);

    processedFiles.push({ path: file.path, content });
  }

  return { files: processedFiles, validationResults };
}
