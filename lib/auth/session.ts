/**
 * Session management for Prestige Build local authentication.
 * Uses JWT stored in httpOnly cookies for secure session handling.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { sessions, users, auditLogs } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomUUID } from "crypto";

// Session configuration
const SESSION_COOKIE_NAME = "prestige_session";
const SESSION_DURATION_HOURS = 24;
const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "prestige-build-default-secret-change-me"
);
const JWT_ISSUER = "prestige-build";
const JWT_AUDIENCE = "prestige-build-users";

export interface SessionPayload extends JWTPayload {
  sessionId: string;
  userId: string;
  email: string;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "DISABLED" | "PENDING";
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "DISABLED" | "PENDING";
  mustChangePassword: boolean;
}

/**
 * Creates a new session for a user.
 */
export async function createSession(
  user: SessionUser,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  // Insert session record
  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
    ip,
    userAgent,
  });

  // Create JWT
  const token = await new SignJWT({
    sessionId,
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Sets the session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifies and decodes the session token.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Gets the current session from cookies.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Verify session is still valid in database
  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, payload.sessionId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) return null;

  // Verify user status
  const [user] = await db
    .select({
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  // Reject if user is not ACTIVE
  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return payload;
}

/**
 * Gets the current user from the session.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return null;

  return user as SessionUser;
}

/**
 * Revokes a session.
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

/**
 * Revokes all sessions for a user.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/**
 * Logs out the current user.
 */
export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    await revokeSession(session.sessionId);
  }
  await clearSessionCookie();
}

// ── AUDIT LOGGING ─────────────────────────────────────────────────────────

export type AuditAction =
  | "login_success"
  | "login_fail"
  | "logout"
  | "user_create"
  | "user_activate"
  | "user_deactivate"
  | "user_reset_password"
  | "password_change"
  | "build_start"
  | "build_stop";

/**
 * Logs an audit event.
 */
export async function logAudit(
  action: AuditAction,
  actorUserId: string | null,
  targetUserId: string | null = null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await db.insert(auditLogs).values({
    actorUserId,
    action,
    targetUserId,
    metadata,
  });
}
