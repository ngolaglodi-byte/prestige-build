import { NextResponse, type NextRequest } from "next/server";
import { rateLimitAsync } from "@/lib/rate-limit";
import { jwtVerify } from "jose";

// Session configuration - must match session.ts
const SESSION_COOKIE_NAME = "prestige_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "prestige-build-default-secret-change-me"
);
const JWT_ISSUER = "prestige-build";
const JWT_AUDIENCE = "prestige-build-users";

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/logout",
  "/setup",
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/setup",
];

// Routes that require ADMIN role
const adminRoutes = [
  "/admin",
  "/api/admin",
];

// Routes that require authentication (ADMIN or AGENT ACTIVE)
const protectedRoutes = [
  "/dashboard",
  "/workspace",
  "/projects",
  "/settings",
  "/team",
  "/builder",
  "/api/builder",
  "/api/projects",
  "/api/teams",
  "/api/ai",
  "/api/deploy",
  "/api/files",
  "/api/integrations",
];

// Webhook routes (no auth required)
const webhookRoutes = [
  "/api/webhooks",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
}

function isWebhookRoute(pathname: string): boolean {
  return webhookRoutes.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname === route || pathname.startsWith(route + "/") || pathname.startsWith(route)) || isAdminRoute(pathname);
}

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

interface SessionPayload {
  sessionId: string;
  userId: string;
  email: string;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "DISABLED" | "PENDING";
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip webhooks (they have their own auth via signatures)
  if (isWebhookRoute(pathname)) {
    return NextResponse.next();
  }

  // Apply rate limiting to API routes
  const rlResponse = await rateLimitMiddleware(req);
  if (rlResponse && rlResponse.status === 429) {
    return rlResponse;
  }

  // Public routes don't need auth
  if (isPublicRoute(pathname)) {
    return rlResponse ?? NextResponse.next();
  }

  // Check if route requires authentication
  if (!isProtectedRoute(pathname)) {
    return rlResponse ?? NextResponse.next();
  }

  // Get session from cookie
  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    // Redirect to login or return 401 for API
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify session token
  const session = await verifySessionToken(sessionToken);

  if (!session) {
    // Invalid or expired session
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Session invalide ou expirée" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Check user status
  if (session.status !== "ACTIVE") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Compte non actif" }, { status: 403 });
    }
    const response = NextResponse.redirect(new URL("/login?error=inactive", req.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Check admin routes
  if (isAdminRoute(pathname) && session.role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Accès réservé aux administrateurs" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Add user info to request headers for downstream use
  const response = rlResponse ?? NextResponse.next();
  response.headers.set("x-user-id", session.userId);
  response.headers.set("x-user-email", session.email);
  response.headers.set("x-user-role", session.role);

  return response;
}

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
