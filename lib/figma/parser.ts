// lib/figma/parser.ts
// Parse Figma API response into an intermediate DesignTree representation.

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaFill {
  type: string;
  color?: FigmaColor;
  opacity?: number;
}

export interface FigmaTextStyle {
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  lineHeightPx?: number;
  letterSpacing?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
}

export interface FigmaLayoutInfo {
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  cornerRadius?: number;
  width?: number;
  height?: number;
}

export interface FigmaEffect {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}

export interface DesignNode {
  id: string;
  name: string;
  type: string;
  fills: FigmaFill[];
  opacity: number;
  layoutInfo: FigmaLayoutInfo;
  textStyle?: FigmaTextStyle;
  characters?: string;
  children: DesignNode[];
  isComponent: boolean;
  componentId?: string;
  effects?: FigmaEffect[];
}

export interface DesignPage {
  id: string;
  name: string;
  children: DesignNode[];
}

export interface DesignTree {
  fileKey: string;
  fileName: string;
  pages: DesignPage[];
  components: Record<string, DesignNode>;
  styles: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseNode(raw: any): DesignNode {
  const fills: FigmaFill[] = Array.isArray(raw.fills)
    ? raw.fills.map((f: FigmaFill) => ({
        type: f.type,
        color: f.color,
        opacity: f.opacity,
      }))
    : [];

  const layoutInfo: FigmaLayoutInfo = {
    layoutMode: raw.layoutMode,
    primaryAxisAlignItems: raw.primaryAxisAlignItems,
    counterAxisAlignItems: raw.counterAxisAlignItems,
    paddingLeft: raw.paddingLeft,
    paddingRight: raw.paddingRight,
    paddingTop: raw.paddingTop,
    paddingBottom: raw.paddingBottom,
    itemSpacing: raw.itemSpacing,
    cornerRadius: raw.cornerRadius,
    width: raw.absoluteBoundingBox?.width,
    height: raw.absoluteBoundingBox?.height,
  };

  const textStyle: FigmaTextStyle | undefined = raw.style
    ? {
        fontFamily: raw.style.fontFamily,
        fontWeight: raw.style.fontWeight,
        fontSize: raw.style.fontSize,
        lineHeightPx: raw.style.lineHeightPx,
        letterSpacing: raw.style.letterSpacing,
        textAlignHorizontal: raw.style.textAlignHorizontal,
        textAlignVertical: raw.style.textAlignVertical,
      }
    : undefined;

  const children: DesignNode[] = Array.isArray(raw.children)
    ? raw.children.map(parseNode)
    : [];

  const effects: FigmaEffect[] = Array.isArray(raw.effects)
    ? raw.effects.map((e: FigmaEffect) => ({
        type: e.type,
        visible: e.visible,
        color: e.color,
        offset: e.offset,
        radius: e.radius,
        spread: e.spread,
      }))
    : [];

  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    type: raw.type ?? "FRAME",
    fills,
    opacity: raw.opacity ?? 1,
    layoutInfo,
    textStyle,
    characters: raw.characters,
    children,
    isComponent: raw.type === "COMPONENT" || raw.type === "COMPONENT_SET",
    componentId: raw.componentId,
    effects,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseFigmaFile(fileKey: string, raw: any): DesignTree {
  const document = raw.document ?? {};
  const rawPages: unknown[] = Array.isArray(document.children) ? document.children : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pages: DesignPage[] = rawPages.map((p: any) => ({
    id: p.id ?? "",
    name: p.name ?? "",
    children: Array.isArray(p.children) ? p.children.map(parseNode) : [],
  }));

  const components: Record<string, DesignNode> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawComponents: Record<string, any> = raw.components ?? {};
  for (const [id, comp] of Object.entries(rawComponents)) {
    components[id] = parseNode({ ...comp, id, type: "COMPONENT" });
  }

  return {
    fileKey,
    fileName: raw.name ?? "",
    pages,
    components,
    styles: raw.styles ?? {},
  };
}
