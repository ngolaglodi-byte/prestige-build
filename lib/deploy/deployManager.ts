// lib/deploy/deployManager.ts
import fs from "fs";
import path from "path";
import { buildProject } from "./buildProject";
import { vercelRequest } from "./vercelClient";
import { setDeployState } from "./deployRegistry";
import { getDefaultSubdomain } from "./domainUtils";

export async function deployProject(projectId: string) {
  setDeployState(projectId, {
    status: "building",
    logs: "Building project...\n",
  });

  const build = await buildProject(projectId);

  if (!build.success) {
    setDeployState(projectId, {
      status: "failed",
      logs: build.logs,
    });
    return;
  }

  setDeployState(projectId, {
    status: "uploading",
    logs: build.logs + "\nUploading to Vercel...\n",
  });

  // 1. Upload files to Vercel
  const files = await collectFiles(build.outputDir!);

  const uploadRes = await vercelRequest("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: projectId,
      files,
      projectSettings: {
        framework: "nextjs",
      },
    }),
  });

  if (uploadRes.error) {
    setDeployState(projectId, {
      status: "failed",
      logs: build.logs + "\n" + uploadRes.error.message,
    });
    return;
  }

  const url = uploadRes.url;

  setDeployState(projectId, {
    status: "success",
    logs: build.logs + "\nDeployed to: " + url,
    url,
  });
}

async function collectFiles(dir: string) {
  const files: any[] = [];

  function walk(current: string) {
    const entries = fs.readdirSync(current);

    for (const entry of entries) {
      const full = path.join(current, entry);
      const stat = fs.statSync(full);

      if (stat.isDirectory()) {
        walk(full);
      } else {
        const content = fs.readFileSync(full);
        files.push({
          file: full.replace(dir + "/", ""),
          data: content.toString("base64"),
        });
      }
    }
  }

  walk(dir);
  return files;
}
