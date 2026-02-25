import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const isWebhookRoute = createRouteMatcher([
  "/api/clerk/webhook(.*)",
  "/api/billing/webhook(.*)",
  "/api/webhooks(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/health",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/(site)(.*)",
]);

const isDashboardRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/workspace(.*)",
  "/projects(.*)",
  "/settings(.*)",
  "/billing(.*)",
  "/team(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth for webhook routes — they use their own signature verification
  if (isWebhookRoute(req)) return;

  // Rate limiting on API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
    const { success, remaining } = rateLimit(`api:${ip}`);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
        }
      );
    }
    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    return res;
  }

  // Protect dashboard routes
  if (isDashboardRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
