import { describe, it, expect } from "vitest";
import { stylePropsToClasses } from "@/lib/editor/style-engine";

describe("style-engine", () => {
  it("returns empty string for empty props", () => {
    expect(stylePropsToClasses({})).toBe("");
  });

  it("maps padding to Tailwind class", () => {
    expect(stylePropsToClasses({ padding: "md" })).toBe("p-4");
  });

  it("maps margin to Tailwind class", () => {
    expect(stylePropsToClasses({ margin: "lg" })).toBe("m-6");
  });

  it("maps fontSize and fontWeight", () => {
    const result = stylePropsToClasses({ fontSize: "xl", fontWeight: "bold" });
    expect(result).toContain("text-xl");
    expect(result).toContain("font-bold");
  });

  it("maps display and gap", () => {
    const result = stylePropsToClasses({ display: "flex", gap: "sm" });
    expect(result).toContain("flex");
    expect(result).toContain("gap-2");
  });

  it("maps borderRadius", () => {
    expect(stylePropsToClasses({ borderRadius: "full" })).toBe("rounded-full");
  });

  it("passes through bgColor as bg- class", () => {
    expect(stylePropsToClasses({ bgColor: "red-500" })).toBe("bg-red-500");
  });

  it("passes through textColor, width, height, border", () => {
    const result = stylePropsToClasses({
      textColor: "white",
      width: "full",
      height: "screen",
      border: "border-2",
    });
    expect(result).toContain("text-white");
    expect(result).toContain("w-full");
    expect(result).toContain("h-screen");
    expect(result).toContain("border-2");
  });
});
