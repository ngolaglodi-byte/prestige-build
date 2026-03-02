/**
 * Figma REST API client.
 */

export interface FigmaFileResponse {
  name: string;
  document: FigmaNode;
  components: Record<string, { name: string; description: string }>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  fills?: FigmaFill[];
  strokes?: FigmaFill[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  opacity?: number;
  style?: Record<string, unknown>;
  characters?: string;
  layoutMode?: "HORIZONTAL" | "VERTICAL" | "NONE";
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  constraints?: { vertical: string; horizontal: string };
  clipsContent?: boolean;
}

export interface FigmaFill {
  type: "SOLID" | "GRADIENT_LINEAR" | "IMAGE";
  color?: { r: number; g: number; b: number; a: number };
  imageRef?: string;
  visible?: boolean;
}

export async function fetchFigmaFile(
  fileKey: string,
  token: string
): Promise<FigmaFileResponse> {
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) {
    throw new Error(`Figma API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchFigmaImages(
  fileKey: string,
  token: string,
  nodeIds: string[]
): Promise<Record<string, string>> {
  if (nodeIds.length === 0) return {};
  const ids = nodeIds.join(",");
  const res = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=png&scale=2`,
    { headers: { "X-Figma-Token": token } }
  );
  if (!res.ok) {
    throw new Error(`Figma images API error: ${res.status}`);
  }
  const data = await res.json();
  return data.images ?? {};
}

export function extractFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
