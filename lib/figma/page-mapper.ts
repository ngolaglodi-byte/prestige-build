/**
 * Figma Page Mapper — maps Figma frames/pages to Next.js pages.
 *
 * Takes a parsed Figma file and produces a mapping of
 * Figma frames to Next.js App Router routes.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FigmaFrame {
  id: string;
  name: string;
  type: "FRAME" | "COMPONENT" | "COMPONENT_SET" | "SECTION";
  width: number;
  height: number;
  children?: FigmaFrame[];
}

export interface PageMapping {
  figmaFrameId: string;
  figmaFrameName: string;
  routePath: string;
  componentName: string;
  fileName: string;
  isLayout: boolean;
}

// ---------------------------------------------------------------------------
// Frame → Route mapping
// ---------------------------------------------------------------------------

/**
 * Convert a Figma frame name to a valid Next.js route path.
 *
 * Examples:
 *  "Home" → "/"
 *  "About Page" → "/about"
 *  "Dashboard - Settings" → "/dashboard/settings"
 *  "User Profile" → "/user-profile"
 */
export function frameNameToRoute(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/\s*[-–—/]\s*/g, "/")
    .replace(/\s+page$/i, "")
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/\/+/g, "/");

  // Special cases
  if (
    cleaned === "home" ||
    cleaned === "accueil" ||
    cleaned === "index" ||
    cleaned === "landing"
  ) {
    return "/";
  }

  return `/${cleaned}`;
}

/**
 * Convert a route path to a Next.js App Router file path.
 *
 * Examples:
 *  "/" → "app/page.tsx"
 *  "/about" → "app/about/page.tsx"
 *  "/dashboard/settings" → "app/dashboard/settings/page.tsx"
 */
export function routeToFilePath(route: string): string {
  if (route === "/") {
    return "app/page.tsx";
  }
  const segments = route.replace(/^\//, "").replace(/\/$/, "");
  return `app/${segments}/page.tsx`;
}

/**
 * Convert a frame name to a valid React component name.
 */
export function frameNameToComponentName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

// ---------------------------------------------------------------------------
// Layout detection
// ---------------------------------------------------------------------------

const LAYOUT_KEYWORDS = [
  "layout",
  "header",
  "footer",
  "sidebar",
  "navigation",
  "navbar",
  "nav",
  "menu",
  "shell",
];

export function isLayoutFrame(name: string): boolean {
  const lower = name.toLowerCase();
  return LAYOUT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Main mapping function
// ---------------------------------------------------------------------------

/**
 * Map top-level Figma frames/pages to Next.js routes.
 *
 * Only frames at the top level of a Figma page are mapped to routes.
 * Nested frames are treated as components within those pages.
 */
export function mapFramesToPages(frames: FigmaFrame[]): PageMapping[] {
  const mappings: PageMapping[] = [];
  const usedRoutes = new Set<string>();

  for (const frame of frames) {
    if (frame.type !== "FRAME" && frame.type !== "SECTION") continue;

    const isLayout = isLayoutFrame(frame.name);
    let route = frameNameToRoute(frame.name);

    // Avoid duplicate routes
    if (usedRoutes.has(route)) {
      route = `${route}-${frame.id.slice(0, 4)}`;
    }
    usedRoutes.add(route);

    const componentName = frameNameToComponentName(frame.name);
    const fileName = isLayout
      ? route === "/"
        ? "app/layout.tsx"
        : `app${route}/layout.tsx`
      : routeToFilePath(route);

    mappings.push({
      figmaFrameId: frame.id,
      figmaFrameName: frame.name,
      routePath: route,
      componentName: componentName || "Page",
      fileName,
      isLayout,
    });
  }

  return mappings;
}

// ---------------------------------------------------------------------------
// Component extraction from sub-frames
// ---------------------------------------------------------------------------

export interface ComponentMapping {
  figmaNodeId: string;
  name: string;
  fileName: string;
}

/**
 * Extract reusable components from Figma COMPONENT nodes.
 */
export function extractComponents(frames: FigmaFrame[]): ComponentMapping[] {
  const components: ComponentMapping[] = [];

  function walk(nodes: FigmaFrame[]) {
    for (const node of nodes) {
      if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
        const name = frameNameToComponentName(node.name);
        components.push({
          figmaNodeId: node.id,
          name,
          fileName: `components/${name}.tsx`,
        });
      }
      if (node.children) {
        walk(node.children);
      }
    }
  }

  walk(frames);
  return components;
}
