import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    uptime: process.uptime(),
  });
}
