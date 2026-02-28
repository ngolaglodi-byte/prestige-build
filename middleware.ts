import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimitAsync } from "@/lib/rate-limit";

const isWebhookRoute = createRouteMatcher([
  "/api/clerk/webhook(.*)",
  "/api/billing/webhook(.*)",
  "/api/webhooks(.*)",
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

async function rateLimitMiddleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
    const { success, remaining } = await rateLimitAsync(`api:${ip}`);
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
  return undefined;
}

// When Clerk keys are not configured, use a simple passthrough middleware
// that still applies rate limiting but skips authentication.
const hasClerkKeys =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

export default hasClerkKeys
  ? clerkMiddleware(async (auth, req) => {
      if (isWebhookRoute(req)) return;

      const rlResponse = await rateLimitMiddleware(req);
      if (rlResponse) return rlResponse;

      if (isDashboardRoute(req)) {
        await auth.protect();
      }
    })
  : async function fallbackMiddleware(req: NextRequest) {
      return (await rateLimitMiddleware(req)) ?? NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
