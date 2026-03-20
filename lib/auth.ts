/**
 * Authentication helpers for Prestige Build.
 * Uses local authentication (email + password) with JWT sessions.
 */
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Gets the current user's ID from the session.
 * Throws if not authenticated.
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (user.status !== "ACTIVE") throw new Error("Account not active");
  return user.id;
}

/**
 * Gets the current user with role information.
 */
export async function getCurrentUserWithRole(): Promise<{
  id: string;
  email: string;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "DISABLED" | "PENDING";
  name: string | null;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    name: user.name,
  };
}

/**
 * Checks if the current user is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" && user?.status === "ACTIVE";
}

/**
 * Checks if the current user is active (either ADMIN or AGENT).
 */
export async function isActiveUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.status === "ACTIVE";
}
