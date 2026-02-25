import { describe, it, expect } from "vitest";
import { resolvePreviewUrl } from "@/lib/preview/resolveUrl";
import { parseBuildError } from "@/lib/preview/errorParser";
import { getFrameworkCommand } from "@/lib/preview/frameworkCommands";
import { buildNetworkSandboxEnv } from "@/lib/preview/networkSandbox";

describe("preview/resolveUrl", () => {
  it("returns localhost URL in development", () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    expect(resolvePreviewUrl(3000)).toBe("http://localhost:3000");
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  it("returns production URL in production", () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(resolvePreviewUrl(3000)).toBe("https://preview.prestigebuild.com/3000");
    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });
});

describe("preview/errorParser", () => {
  it("detects error keywords", () => {
    expect(parseBuildError("Error: something failed")).not.toBeNull();
    expect(parseBuildError("TypeError: undefined")).not.toBeNull();
    expect(parseBuildError("Build failed at step 3")).not.toBeNull();
    expect(parseBuildError("SyntaxError in file")).not.toBeNull();
    expect(parseBuildError("ReferenceError: x is not defined")).not.toBeNull();
  });

  it("returns null for clean logs", () => {
    expect(parseBuildError("Build completed successfully")).toBeNull();
    expect(parseBuildError("All tests passed")).toBeNull();
  });
});

describe("preview/frameworkCommands", () => {
  it("returns next.js dev command", () => {
    const cmd = getFrameworkCommand("nextjs", 3000);
    expect(cmd.cmd).toBe("npm");
    expect(cmd.args).toContain("dev");
  });

  it("returns vite command with port", () => {
    const cmd = getFrameworkCommand("vite", 5173);
    expect(cmd.args).toContain("--port");
    expect(cmd.args).toContain("5173");
  });

  it("returns express command with PORT env", () => {
    const cmd = getFrameworkCommand("express", 4000);
    expect(cmd.cmd).toBe("node");
    expect(cmd.env!.PORT).toBe("4000");
  });

  it("returns cra command with PORT env", () => {
    const cmd = getFrameworkCommand("cra", 3001);
    expect(cmd.env!.PORT).toBe("3001");
  });

  it("returns default command for unknown framework", () => {
    const cmd = getFrameworkCommand("unknown", 3000);
    expect(cmd.cmd).toBe("npm");
    expect(cmd.args).toContain("dev");
  });

  it("returns astro command", () => {
    const cmd = getFrameworkCommand("astro", 4321);
    expect(cmd.args).toContain("--port");
  });

  it("returns sveltekit command", () => {
    const cmd = getFrameworkCommand("sveltekit", 5173);
    expect(cmd.args).toContain("--port");
  });
});

describe("preview/networkSandbox", () => {
  it("marks environment as sandboxed", () => {
    const env = buildNetworkSandboxEnv({} as NodeJS.ProcessEnv, "proj-123");
    expect(env.SANDBOXED).toBe("true");
    expect(env.SANDBOX_PROJECT_ID).toBe("proj-123");
  });

  it("disables proxy env vars", () => {
    const env = buildNetworkSandboxEnv({ HTTP_PROXY: "http://proxy.example.com" } as unknown as NodeJS.ProcessEnv, "proj-1");
    expect(env.HTTP_PROXY).toBe("");
    expect(env.HTTPS_PROXY).toBe("");
    expect(env.ALL_PROXY).toBe("");
  });

  it("sets NO_PROXY to localhost", () => {
    const env = buildNetworkSandboxEnv({} as NodeJS.ProcessEnv, "proj-1");
    expect(env.NO_PROXY).toBe("localhost,127.0.0.1");
  });

  it("preserves existing env vars", () => {
    const env = buildNetworkSandboxEnv({ MY_VAR: "value" } as unknown as NodeJS.ProcessEnv, "proj-1");
    expect(env.MY_VAR).toBe("value");
  });

  it("enforces TLS verification", () => {
    const env = buildNetworkSandboxEnv({} as NodeJS.ProcessEnv, "proj-1");
    expect(env.NODE_TLS_REJECT_UNAUTHORIZED).toBe("1");
  });
});
