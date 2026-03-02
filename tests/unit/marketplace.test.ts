import { describe, it, expect } from "vitest";
import {
  filterProjects,
  extractUniqueTags,
  extractCategories,
  prepareCloneMetadata,
  type MarketplaceProject,
} from "@/lib/marketplace";

function createProject(overrides: Partial<MarketplaceProject> = {}): MarketplaceProject {
  return {
    id: "mp-1",
    projectId: "p-1",
    userId: "u-1",
    title: "Test Project",
    description: "A test project description",
    category: "web",
    tags: ["react", "tailwind"],
    techStack: ["nextjs", "typescript"],
    featured: false,
    likes: 10,
    views: 100,
    remixCount: 5,
    cloneCount: 3,
    status: "approved",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("marketplace", () => {
  describe("filterProjects", () => {
    const projects = [
      createProject({ id: "1", title: "React Dashboard", tags: ["react"], likes: 20, views: 200 }),
      createProject({ id: "2", title: "Vue Store", category: "ecommerce", tags: ["vue"], likes: 5, views: 50 }),
      createProject({ id: "3", title: "Pending App", status: "pending" }),
      createProject({ id: "4", title: "Featured App", featured: true, likes: 100 }),
    ];

    it("filters out non-approved projects", () => {
      const result = filterProjects(projects, { sortBy: "newest", page: 1, perPage: 10 });
      expect(result.projects.every((p) => p.status === "approved")).toBe(true);
      expect(result.total).toBe(3);
    });

    it("searches by query in title", () => {
      const result = filterProjects(projects, { query: "Dashboard", sortBy: "newest", page: 1, perPage: 10 });
      expect(result.total).toBe(1);
      expect(result.projects[0].title).toBe("React Dashboard");
    });

    it("filters by category", () => {
      const result = filterProjects(projects, { category: "ecommerce", sortBy: "newest", page: 1, perPage: 10 });
      expect(result.total).toBe(1);
    });

    it("filters by tags", () => {
      const result = filterProjects(projects, { tags: ["vue"], sortBy: "newest", page: 1, perPage: 10 });
      expect(result.total).toBe(1);
    });

    it("filters featured projects", () => {
      const result = filterProjects(projects, { featured: true, sortBy: "newest", page: 1, perPage: 10 });
      expect(result.total).toBe(1);
      expect(result.projects[0].title).toBe("Featured App");
    });

    it("sorts by popularity (likes)", () => {
      const result = filterProjects(projects, { sortBy: "popular", page: 1, perPage: 10 });
      expect(result.projects[0].likes).toBeGreaterThanOrEqual(result.projects[1].likes);
    });

    it("paginates correctly", () => {
      const result = filterProjects(projects, { sortBy: "newest", page: 1, perPage: 2 });
      expect(result.projects).toHaveLength(2);
      expect(result.totalPages).toBe(2);
    });

    it("returns correct page info", () => {
      const result = filterProjects(projects, { sortBy: "newest", page: 2, perPage: 2 });
      expect(result.page).toBe(2);
      expect(result.projects).toHaveLength(1);
    });
  });

  describe("extractUniqueTags", () => {
    it("extracts and deduplicates tags", () => {
      const projects = [
        createProject({ tags: ["React", "Tailwind"] }),
        createProject({ tags: ["react", "typescript"] }),
      ];
      const tags = extractUniqueTags(projects);
      expect(tags).toContain("react");
      expect(tags).toContain("tailwind");
      expect(tags).toContain("typescript");
      // Should deduplicate case-insensitively
      expect(tags.filter((t) => t === "react")).toHaveLength(1);
    });
  });

  describe("extractCategories", () => {
    it("extracts unique categories", () => {
      const projects = [
        createProject({ category: "web" }),
        createProject({ category: "ecommerce" }),
        createProject({ category: "web" }),
      ];
      const categories = extractCategories(projects);
      expect(categories).toHaveLength(2);
      expect(categories).toContain("web");
      expect(categories).toContain("ecommerce");
    });
  });

  describe("prepareCloneMetadata", () => {
    it("creates clone metadata with remix suffix", () => {
      const original = createProject({ title: "My Project", tags: ["react"] });
      const clone = prepareCloneMetadata(original, "user-2", "new-proj-id");
      expect(clone.title).toBe("My Project (remix)");
      expect(clone.userId).toBe("user-2");
      expect(clone.projectId).toBe("new-proj-id");
      expect(clone.tags).toContain("remix");
      expect(clone.likes).toBe(0);
      expect(clone.views).toBe(0);
      expect(clone.status).toBe("pending");
    });
  });
});
