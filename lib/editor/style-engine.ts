/**
 * Style engine: maps visual property changes to Tailwind classes.
 */

export interface StyleProps {
  padding?: string;
  margin?: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  border?: string;
  width?: string;
  height?: string;
  display?: string;
  gap?: string;
}

const PROP_TO_CLASS: Record<string, Record<string, string>> = {
  padding: { sm: "p-2", md: "p-4", lg: "p-6", xl: "p-8" },
  margin: { sm: "m-2", md: "m-4", lg: "m-6", xl: "m-8" },
  fontSize: { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl" },
  fontWeight: { normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" },
  borderRadius: { none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", full: "rounded-full" },
  display: { flex: "flex", grid: "grid", block: "block", hidden: "hidden" },
  gap: { sm: "gap-2", md: "gap-4", lg: "gap-6" },
};

export function stylePropsToClasses(props: StyleProps): string {
  const classes: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (!value) continue;
    const mapping = PROP_TO_CLASS[key];
    if (mapping && mapping[value]) {
      classes.push(mapping[value]);
    }
    // Direct Tailwind class passthrough for colors
    if (key === "bgColor" && value) classes.push(`bg-${value}`);
    if (key === "textColor" && value) classes.push(`text-${value}`);
    if (key === "width" && value) classes.push(`w-${value}`);
    if (key === "height" && value) classes.push(`h-${value}`);
    if (key === "border" && value) classes.push(value);
  }
  return classes.join(" ");
}
