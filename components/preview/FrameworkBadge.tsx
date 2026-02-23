"use client";

export type Framework =
  | "nextjs"
  | "react"
  | "vue"
  | "svelte"
  | "astro"
  | "html"
  | "node";

const FRAMEWORK_LABELS: Record<Framework, string> = {
  nextjs: "Next.js",
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
  astro: "Astro",
  html: "HTML/CSS/JS",
  node: "Node.js",
};

const FRAMEWORK_COLORS: Record<Framework, string> = {
  nextjs: "bg-white/10 text-white",
  react: "bg-cyan-900/40 text-cyan-300",
  vue: "bg-emerald-900/40 text-emerald-300",
  svelte: "bg-orange-900/40 text-orange-300",
  astro: "bg-purple-900/40 text-purple-300",
  html: "bg-amber-900/40 text-amber-300",
  node: "bg-green-900/40 text-green-300",
};

interface Props {
  framework: Framework;
}

export function FrameworkBadge({ framework }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${FRAMEWORK_COLORS[framework]}`}
    >
      {FRAMEWORK_LABELS[framework]}
    </span>
  );
}
