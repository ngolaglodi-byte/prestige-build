/**
 * Base templates for code generation scaffolding.
 */

export interface GeneratedFile {
  path: string;
  content: string;
}

export function componentTemplate(name: string, jsx: string): string {
  return `"use client";

import React from "react";

export default function ${name}() {
  return (
    ${jsx}
  );
}
`;
}

export function pageTemplate(name: string, jsx: string): string {
  return `import React from "react";

export default function ${name}Page() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--foreground)] p-8">
      ${jsx}
    </main>
  );
}
`;
}

export function apiRouteTemplate(handler: string): string {
  return `import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  ${handler}
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ success: true, data: body });
}
`;
}

export function layoutTemplate(title: string): string {
  return `import React from "react";

export const metadata = { title: "${title}" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;
}
