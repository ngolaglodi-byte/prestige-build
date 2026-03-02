import { describe, it, expect } from "vitest";
import { purgeCache, cacheControlHeader } from "@/lib/deploy/cdnManager";

describe("cdnManager", () => {
  describe("cacheControlHeader", () => {
    it("returns must-revalidate for HTML files", () => {
      expect(cacheControlHeader("index.html")).toContain("must-revalidate");
    });

    it("returns must-revalidate for JSON files", () => {
      expect(cacheControlHeader("data.json")).toContain("must-revalidate");
    });

    it("returns immutable for JS files", () => {
      expect(cacheControlHeader("app.js")).toContain("immutable");
    });

    it("returns immutable for CSS files", () => {
      expect(cacheControlHeader("style.css")).toContain("immutable");
    });

    it("returns immutable for images", () => {
      expect(cacheControlHeader("logo.png")).toContain("immutable");
    });
  });
});
