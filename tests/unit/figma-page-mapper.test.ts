import { describe, it, expect } from "vitest";
import {
  frameNameToRoute,
  routeToFilePath,
  frameNameToComponentName,
  isLayoutFrame,
  mapFramesToPages,
  extractComponents,
  type FigmaFrame,
} from "@/lib/figma/page-mapper";

describe("figma/page-mapper", () => {
  describe("frameNameToRoute", () => {
    it("maps Home to /", () => {
      expect(frameNameToRoute("Home")).toBe("/");
    });

    it("maps Accueil to /", () => {
      expect(frameNameToRoute("Accueil")).toBe("/");
    });

    it("maps Landing to /", () => {
      expect(frameNameToRoute("Landing")).toBe("/");
    });

    it("maps About Page to /about", () => {
      expect(frameNameToRoute("About Page")).toBe("/about");
    });

    it("maps Dashboard - Settings to /dashboard/settings", () => {
      expect(frameNameToRoute("Dashboard - Settings")).toBe("/dashboard/settings");
    });

    it("maps User Profile to /user-profile", () => {
      expect(frameNameToRoute("User Profile")).toBe("/user-profile");
    });

    it("handles special characters", () => {
      const route = frameNameToRoute("Espace Client #2");
      expect(route).toMatch(/^\/[a-z0-9-/]+$/);
    });
  });

  describe("routeToFilePath", () => {
    it("maps / to app/page.tsx", () => {
      expect(routeToFilePath("/")).toBe("app/page.tsx");
    });

    it("maps /about to app/about/page.tsx", () => {
      expect(routeToFilePath("/about")).toBe("app/about/page.tsx");
    });

    it("maps nested route", () => {
      expect(routeToFilePath("/dashboard/settings")).toBe(
        "app/dashboard/settings/page.tsx"
      );
    });
  });

  describe("frameNameToComponentName", () => {
    it("converts to PascalCase", () => {
      expect(frameNameToComponentName("user profile")).toBe("UserProfile");
    });

    it("removes special characters", () => {
      expect(frameNameToComponentName("My App #1")).toBe("MyApp1");
    });
  });

  describe("isLayoutFrame", () => {
    it("identifies layout frames", () => {
      expect(isLayoutFrame("Main Layout")).toBe(true);
      expect(isLayoutFrame("Header")).toBe(true);
      expect(isLayoutFrame("Sidebar Navigation")).toBe(true);
    });

    it("rejects non-layout frames", () => {
      expect(isLayoutFrame("Dashboard")).toBe(false);
      expect(isLayoutFrame("Login Page")).toBe(false);
    });
  });

  describe("mapFramesToPages", () => {
    const frames: FigmaFrame[] = [
      { id: "f1", name: "Home", type: "FRAME", width: 1440, height: 900 },
      { id: "f2", name: "About Page", type: "FRAME", width: 1440, height: 1200 },
      { id: "f3", name: "Header Layout", type: "FRAME", width: 1440, height: 80 },
      { id: "c1", name: "Button", type: "COMPONENT", width: 120, height: 40 },
    ];

    it("maps FRAME types to pages", () => {
      const mappings = mapFramesToPages(frames);
      expect(mappings).toHaveLength(3); // Excludes COMPONENT
    });

    it("maps Home to /", () => {
      const mappings = mapFramesToPages(frames);
      const home = mappings.find((m) => m.figmaFrameName === "Home");
      expect(home?.routePath).toBe("/");
      expect(home?.fileName).toBe("app/page.tsx");
    });

    it("detects layout frames", () => {
      const mappings = mapFramesToPages(frames);
      const header = mappings.find((m) => m.figmaFrameName === "Header Layout");
      expect(header?.isLayout).toBe(true);
    });

    it("generates correct component names", () => {
      const mappings = mapFramesToPages(frames);
      const about = mappings.find((m) => m.figmaFrameName === "About Page");
      expect(about?.componentName).toBe("AboutPage");
    });
  });

  describe("extractComponents", () => {
    const frames: FigmaFrame[] = [
      {
        id: "f1",
        name: "Page",
        type: "FRAME",
        width: 1440,
        height: 900,
        children: [
          { id: "c1", name: "Card Component", type: "COMPONENT", width: 300, height: 200 },
          { id: "cs1", name: "Button Set", type: "COMPONENT_SET", width: 120, height: 40 },
        ],
      },
    ];

    it("extracts COMPONENT and COMPONENT_SET nodes", () => {
      const components = extractComponents(frames);
      expect(components).toHaveLength(2);
    });

    it("generates correct file paths", () => {
      const components = extractComponents(frames);
      expect(components[0].fileName).toBe("components/CardComponent.tsx");
    });
  });
});
