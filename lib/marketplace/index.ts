/**
 * Marketplace module — extends the existing showcase system
 * with community features: tagging, favourites, cloning, and search.
 *
 * Pure logic layer; no direct DB access so it can be tested in isolation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketplaceProject {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  liveUrl?: string;
  repoUrl?: string;
  category: string;
  tags: string[];
  techStack: string[];
  featured: boolean;
  likes: number;
  views: number;
  remixCount: number;
  cloneCount: number;
  status: "pending" | "approved" | "rejected";
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  techStack?: string[];
  featured?: boolean;
  sortBy: "newest" | "popular" | "most_viewed" | "most_remixed";
  page: number;
  perPage: number;
}

export interface MarketplaceSearchResult {
  projects: MarketplaceProject[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface MarketplaceFavorite {
  userId: string;
  projectId: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Search / Filter helpers
// ---------------------------------------------------------------------------

export function filterProjects(
  projects: MarketplaceProject[],
  params: MarketplaceSearchParams
): MarketplaceSearchResult {
  let filtered = projects.filter((p) => p.status === "approved");

  // Text search (title + description + tags)
  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (params.category) {
    filtered = filtered.filter((p) => p.category === params.category);
  }

  // Tags filter
  if (params.tags && params.tags.length > 0) {
    filtered = filtered.filter((p) =>
      params.tags!.some((t) => p.tags.includes(t))
    );
  }

  // Tech stack filter
  if (params.techStack && params.techStack.length > 0) {
    filtered = filtered.filter((p) =>
      params.techStack!.some((t) => p.techStack.includes(t))
    );
  }

  // Featured filter
  if (params.featured !== undefined) {
    filtered = filtered.filter((p) => p.featured === params.featured);
  }

  // Sorting
  filtered.sort((a, b) => {
    switch (params.sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "popular":
        return b.likes - a.likes;
      case "most_viewed":
        return b.views - a.views;
      case "most_remixed":
        return b.remixCount - a.remixCount;
      default:
        return 0;
    }
  });

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / params.perPage);
  const start = (params.page - 1) * params.perPage;
  const paged = filtered.slice(start, start + params.perPage);

  return {
    projects: paged,
    total,
    page: params.page,
    perPage: params.perPage,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// Tag extraction helpers
// ---------------------------------------------------------------------------

export function extractUniqueTags(projects: MarketplaceProject[]): string[] {
  const tagSet = new Set<string>();
  for (const p of projects) {
    for (const t of p.tags) {
      tagSet.add(t.toLowerCase());
    }
  }
  return Array.from(tagSet).sort();
}

export function extractCategories(projects: MarketplaceProject[]): string[] {
  const catSet = new Set<string>();
  for (const p of projects) {
    catSet.add(p.category);
  }
  return Array.from(catSet).sort();
}

// ---------------------------------------------------------------------------
// Clone / Remix helpers
// ---------------------------------------------------------------------------

export interface CloneResult {
  newProjectId: string;
  filesCloned: number;
  clonedAt: string;
}

export function prepareCloneMetadata(
  original: MarketplaceProject,
  newUserId: string,
  newProjectId: string
): Omit<MarketplaceProject, "id"> {
  return {
    projectId: newProjectId,
    userId: newUserId,
    title: `${original.title} (remix)`,
    description: original.description,
    shortDescription: original.shortDescription,
    category: original.category,
    tags: [...original.tags, "remix"],
    techStack: [...original.techStack],
    featured: false,
    likes: 0,
    views: 0,
    remixCount: 0,
    cloneCount: 0,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
