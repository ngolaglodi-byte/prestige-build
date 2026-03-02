import { NextRequest, NextResponse } from "next/server";
import {
  type MarketplaceSearchParams,
} from "@/lib/marketplace";

// In-memory cache for demo — in production this would query the DB.
// The existing showcase tables are reused; this adds search/filter logic.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params: MarketplaceSearchParams = {
      query: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean),
      techStack: searchParams.get("tech")?.split(",").filter(Boolean),
      featured: searchParams.has("featured")
        ? searchParams.get("featured") === "true"
        : undefined,
      sortBy:
        (searchParams.get("sort") as MarketplaceSearchParams["sortBy"]) ??
        "newest",
      page: Number(searchParams.get("page") ?? "1"),
      perPage: Math.min(Number(searchParams.get("perPage") ?? "20"), 100),
    };

    // Return the filter structure for the client to use
    // Actual data fetching is done via the existing showcase DB queries
    return NextResponse.json({
      params,
      message:
        "Marketplace endpoint ready. Use with showcase DB queries for full results.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
