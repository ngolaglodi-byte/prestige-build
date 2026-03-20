import { describe, it, expect } from "vitest";
import {
  componentTemplate,
  pageTemplate,
  apiRouteTemplate,
  layoutTemplate,
} from "@/lib/builder/template-engine";

describe("template-engine", () => {
  it("componentTemplate generates a client component", () => {
    const result = componentTemplate("Card", "<div>Hello</div>");
    expect(result).toContain('"use client"');
    expect(result).toContain("export default function Card()");
    expect(result).toContain("<div>Hello</div>");
    expect(result).toContain('import React from "react"');
  });

  it("pageTemplate generates a page with main wrapper", () => {
    const result = pageTemplate("Home", "<h1>Home</h1>");
    expect(result).toContain("export default function HomePage()");
    expect(result).toContain("<main");
    expect(result).toContain("min-h-screen");
    expect(result).toContain("<h1>Home</h1>");
  });

  it("apiRouteTemplate generates GET and POST handlers", () => {
    const result = apiRouteTemplate('return NextResponse.json({ ok: true })');
    expect(result).toContain("export async function GET");
    expect(result).toContain("export async function POST");
    expect(result).toContain("NextRequest");
    expect(result).toContain("NextResponse");
    expect(result).toContain("return NextResponse.json({ ok: true })");
  });

  it("layoutTemplate generates a layout with metadata", () => {
    const result = layoutTemplate("My App");
    expect(result).toContain('title: "My App"');
    expect(result).toContain("export default function Layout");
    expect(result).toContain("children: React.ReactNode");
    expect(result).toContain("{children}");
    expect(result).toContain("<html");
    expect(result).toContain("<body");
  });

  it("pageTemplate does not include use client directive", () => {
    const result = pageTemplate("About", "<p>About</p>");
    expect(result).not.toContain('"use client"');
  });

  it("componentTemplate wraps JSX in return", () => {
    const result = componentTemplate("Button", "<button>Click</button>");
    expect(result).toContain("return (");
    expect(result).toContain("<button>Click</button>");
  });
});
