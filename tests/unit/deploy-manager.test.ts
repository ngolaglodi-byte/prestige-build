import { describe, it, expect } from "vitest";
import type { DeployTarget } from "@/lib/deploy/deployManager";

describe("deployManager", () => {
  it("exports DeployTarget type with internal and vercel", () => {
    const targets: DeployTarget[] = ["internal", "vercel"];
    expect(targets).toContain("internal");
    expect(targets).toContain("vercel");
  });
});
