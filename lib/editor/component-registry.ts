/**
 * Registry of available drag-and-drop components for the visual editor.
 */

export interface ComponentDef {
  id: string;
  label: string;
  category: "layout" | "input" | "display" | "navigation";
  defaultProps: Record<string, unknown>;
  /** Tailwind classes applied by default */
  defaultClasses: string;
  /** JSX tag used for code generation */
  tag: string;
  /** Whether this component can contain children */
  isContainer: boolean;
}

export const COMPONENT_REGISTRY: ComponentDef[] = [
  // Layout
  {
    id: "section",
    label: "Section",
    category: "layout",
    defaultProps: {},
    defaultClasses: "p-6",
    tag: "section",
    isContainer: true,
  },
  {
    id: "container",
    label: "Conteneur",
    category: "layout",
    defaultProps: {},
    defaultClasses: "max-w-5xl mx-auto p-4",
    tag: "div",
    isContainer: true,
  },
  {
    id: "flex-row",
    label: "Flex Row",
    category: "layout",
    defaultProps: {},
    defaultClasses: "flex gap-4",
    tag: "div",
    isContainer: true,
  },
  {
    id: "grid",
    label: "Grid 2 colonnes",
    category: "layout",
    defaultProps: {},
    defaultClasses: "grid grid-cols-2 gap-4",
    tag: "div",
    isContainer: true,
  },
  {
    id: "card",
    label: "Carte",
    category: "layout",
    defaultProps: {},
    defaultClasses: "rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4",
    tag: "div",
    isContainer: true,
  },

  // Display
  {
    id: "heading",
    label: "Titre",
    category: "display",
    defaultProps: { text: "Titre" },
    defaultClasses: "text-2xl font-bold",
    tag: "h2",
    isContainer: false,
  },
  {
    id: "paragraph",
    label: "Paragraphe",
    category: "display",
    defaultProps: { text: "Lorem ipsum dolor sit amet." },
    defaultClasses: "text-sm text-[var(--muted)]",
    tag: "p",
    isContainer: false,
  },
  {
    id: "image",
    label: "Image",
    category: "display",
    defaultProps: { src: "/placeholder.svg", alt: "Image" },
    defaultClasses: "rounded-lg w-full h-48 object-cover",
    tag: "img",
    isContainer: false,
  },

  // Input
  {
    id: "button",
    label: "Bouton",
    category: "input",
    defaultProps: { text: "Cliquez" },
    defaultClasses: "px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accentDark transition-colors",
    tag: "button",
    isContainer: false,
  },
  {
    id: "text-input",
    label: "Champ texte",
    category: "input",
    defaultProps: { placeholder: "Saisir…" },
    defaultClasses: "w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-sm",
    tag: "input",
    isContainer: false,
  },
  {
    id: "textarea",
    label: "Zone de texte",
    category: "input",
    defaultProps: { placeholder: "Saisir…" },
    defaultClasses: "w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-sm min-h-[80px]",
    tag: "textarea",
    isContainer: false,
  },

  // Navigation
  {
    id: "nav-bar",
    label: "Barre de navigation",
    category: "navigation",
    defaultProps: {},
    defaultClasses: "flex items-center justify-between px-6 py-3 border-b border-[var(--border)]",
    tag: "nav",
    isContainer: true,
  },
  {
    id: "link",
    label: "Lien",
    category: "navigation",
    defaultProps: { text: "Lien", href: "#" },
    defaultClasses: "text-accent hover:underline text-sm",
    tag: "a",
    isContainer: false,
  },
];

export function getComponentById(id: string): ComponentDef | undefined {
  return COMPONENT_REGISTRY.find((c) => c.id === id);
}

export function getComponentsByCategory(category: ComponentDef["category"]): ComponentDef[] {
  return COMPONENT_REGISTRY.filter((c) => c.category === category);
}
