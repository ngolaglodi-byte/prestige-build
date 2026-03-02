// lib/deploy/cdnManager.ts
// Cache-layer utilities for internal (Prestige Cloud) deployments.
// Uses Supabase Storage with appropriate Cache-Control headers and
// provides a cache purge mechanism on re-deploy.

import { getSupabaseServiceClient } from "@/lib/supabase";

const BUCKET_NAME = "deployments";

/**
 * Purge all cached files for a project in the deployments bucket.
 * Called before a re-deployment to ensure fresh content is served.
 */
export async function purgeCache(projectId: string): Promise<number> {
  const supabase = getSupabaseServiceClient();
  const slug = projectId.replace(/[^a-zA-Z0-9-_]/g, "_");

  const { data: files } = await supabase.storage
    .from(BUCKET_NAME)
    .list(slug, { limit: 1000 });

  if (!files || files.length === 0) return 0;

  const paths = files.map((f) => `${slug}/${f.name}`);
  await supabase.storage.from(BUCKET_NAME).remove(paths);

  return paths.length;
}

/**
 * Returns the recommended Cache-Control header for a given file type.
 */
export function cacheControlHeader(filePath: string): string {
  if (/\.(html|json)$/.test(filePath)) {
    return "public, max-age=0, must-revalidate";
  }
  // Immutable assets (JS, CSS, images, fonts) — long cache
  return "public, max-age=31536000, immutable";
}
