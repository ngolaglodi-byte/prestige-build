import { NextRequest, NextResponse } from "next/server";
import { convertNodesToComponents } from "@/lib/figma/react-converter";
import type { ParsedNode } from "@/lib/figma/node-parser";

export const runtime = "nodejs";

/**
 * Converts parsed Figma nodes into React components.
 */
export async function POST(req: NextRequest) {
  try {
    const { nodes } = (await req.json()) as { nodes?: ParsedNode[] };

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "nodes array is required" }, { status: 400 });
    }

    const components = convertNodesToComponents(nodes);

    return NextResponse.json({
      components: components.map((c) => ({
        name: c.name,
        code: c.code,
        path: `components/generated/${c.name}.tsx`,
      })),
      count: components.length,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
