import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../../components/OnboardingModal.tsx"),
  "utf-8"
);

// Extract the steps array literal from source
const stepsMatch = source.match(/const steps\s*=\s*\[([\s\S]*?)\n\];/);
const stepsBlock = stepsMatch?.[1] ?? "";

// Split into individual step objects
const stepObjects = stepsBlock.split(/\n  \{/).filter((s) => s.trim().length > 0);

// Parse each step's fields
function parseSteps() {
  return stepObjects.map((block) => {
    const icon = block.match(/icon:\s*"([^"]+)"/)?.[1];
    const title = block.match(/title:\s*"([^"]+)"/)?.[1];
    // description may span multiple lines via string concatenation
    const desc = block.match(/description:\s*\n?\s*"([\s\S]*?)"/)?.[1];
    const ctaHref = block.match(/href:\s*"([^"]+)"/)?.[1];
    const ctaLabel = block.match(/label:\s*"([^"]+)"/)?.[1];
    return {
      icon,
      title,
      description: desc,
      cta: ctaHref ? { label: ctaLabel, href: ctaHref } : undefined,
    };
  });
}

const steps = parseSteps();

describe("OnboardingModal – module & export", () => {
  it("exports a default function", () => {
    expect(source).toMatch(/export default function OnboardingModal/);
  });
});

describe("OnboardingModal – ONBOARDING_KEY", () => {
  it('defines ONBOARDING_KEY as "prestige_onboarding_done"', () => {
    expect(source).toContain(
      'const ONBOARDING_KEY = "prestige_onboarding_done"'
    );
  });
});

describe("OnboardingModal – steps data", () => {
  it("has exactly 6 steps", () => {
    expect(steps).toHaveLength(6);
  });

  it("each step has an icon, title, and description", () => {
    for (const s of steps) {
      expect(s.icon).toBeDefined();
      expect(s.title).toBeDefined();
      expect(s.description).toBeDefined();
    }
  });

  it("all descriptions are non-empty strings", () => {
    for (const s of steps) {
      expect(typeof s.description).toBe("string");
      expect((s.description as string).length).toBeGreaterThan(0);
    }
  });

  it("only the last step has a CTA", () => {
    for (let i = 0; i < steps.length - 1; i++) {
      expect(steps[i].cta).toBeUndefined();
    }
    expect(steps[steps.length - 1].cta).toBeDefined();
  });

  it('CTA href is "/create"', () => {
    expect(steps[steps.length - 1].cta?.href).toBe("/create");
  });

  it("step titles are in expected order", () => {
    const expectedTitles = [
      "Bienvenue sur Prestige Build",
      "Créez votre premier projet",
      "Générez du code avec l'IA",
      "Prévisualisez et déployez",
      "Éditeur visuel & Import Figma",
      "Créez votre première app en 2 minutes",
    ];
    expect(steps.map((s) => s.title)).toEqual(expectedTitles);
  });

  it("all icons are unique", () => {
    const icons = steps.map((s) => s.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });
});
