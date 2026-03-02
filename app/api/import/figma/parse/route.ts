import { NextRequest, NextResponse } from "next/server";
import { fetchFigmaFile, extractFileKey } from "@/lib/figma/figma-client";
import { parseFileNodes } from "@/lib/figma/node-parser";

export const runtime = "nodejs";

/**
 * Parses a Figma file and returns the node tree.
 */
export async function POST(req: NextRequest) {
  try {
    const { url, token } = (await req.json()) as { url?: string; token?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const accessToken = token || process.env.FIGMA_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Figma token is required" }, { status: 400 });
    }

    const fileKey = extractFileKey(url);
    if (!fileKey) {
      return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });
    }

    const file = await fetchFigmaFile(fileKey, accessToken);
    const pages = parseFileNodes(file.document);

    return NextResponse.json({
      name: file.name,
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        childCount: p.children.length,
      })),
      tree: pages,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
