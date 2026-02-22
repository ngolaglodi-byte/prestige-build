import type { Framework } from "./frameworkDetector";

export function getFrameworkCommand(framework: Framework, port: number) {
  switch (framework) {
    case "nextjs":
      return {
        cmd: "npm",
        args: ["run", "dev", "--", "-p", port.toString()],
      };

    case "vite":
      return {
        cmd: "npm",
        args: ["run", "dev", "--", "--port", port.toString()],
      };

    case "cra":
      return {
        cmd: "npm",
        args: ["start"],
        env: { PORT: port.toString() },
      };

    case "express":
      return {
        cmd: "node",
        args: ["server.js"],
        env: { PORT: port.toString() },
      };

    case "astro":
      return {
        cmd: "npm",
        args: ["run", "dev", "--", "--port", port.toString()],
      };

    case "sveltekit":
      return {
        cmd: "npm",
        args: ["run", "dev", "--", "--port", port.toString()],
      };

    default:
      return {
        cmd: "npm",
        args: ["run", "dev"],
      };
  }
}
