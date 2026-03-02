import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Returns an HTML preview that renders the provided component code
 * inside a sandboxed iframe-compatible page.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, title } = body as { code?: string; title?: string };

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title ?? "Preview"}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0d0d0d; color: #e5e7eb; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root">${code}</div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
