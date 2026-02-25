import { describe, it, expect } from "vitest";
import en from "@/lib/translations/en";
import fr from "@/lib/translations/fr";

describe("translations", () => {
  it("en and fr have the same keys", () => {
    const enKeys = Object.keys(en).sort();
    const frKeys = Object.keys(fr).sort();
    expect(enKeys).toEqual(frKeys);
  });

  it("no empty values in en", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en.${key} is empty`).toBeTruthy();
    }
  });

  it("no empty values in fr", () => {
    for (const [key, value] of Object.entries(fr)) {
      expect(value, `fr.${key} is empty`).toBeTruthy();
    }
  });

  it("contains dashboard keys", () => {
    expect(en["dashboard.title"]).toBe("Dashboard");
    expect(fr["dashboard.title"]).toBe("Tableau de bord");
  });

  it("contains settings keys", () => {
    expect(en["settings.title"]).toBe("Settings");
    expect(fr["settings.title"]).toBe("Paramètres");
  });

  it("contains sidebar keys", () => {
    expect(en["sidebar.home"]).toBe("Home");
    expect(fr["sidebar.home"]).toBe("Accueil");
  });
});
