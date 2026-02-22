import { startPreview } from "./startPreview";
import { stopPreview } from "./stopPreview";
import { getProcessForProject } from "./processRegistry";

export const previewManager = {
  start: async (projectId: string) => {
    const existing = getProcessForProject(projectId);
    if (existing) return existing;

    return await startPreview(projectId);
  },

  stop: async (projectId: string) => {
    return await stopPreview(projectId);
  },
};
