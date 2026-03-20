/**
 * Authentication service for Prestige Build local auth.
 * Handles login, registration, and user management.
 */
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, validatePassword } from "./password";
import {
  createSession,
  setSessionCookie,
  logout,
  logAudit,
  revokeAllUserSessions,
  type SessionUser,
} from "./session";
import { randomUUID } from "crypto";

// Brute-force protection configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: SessionUser;
  mustChangePassword?: boolean;
}

export interface CreateUserResult {
  success: boolean;
  error?: string;
  userId?: string;
  email?: string;
  tempPassword?: string;
}

/**
 * Validates email format for Prestige Build (format: initial.nom@ptc.com)
 * Format: first letter of first name + dot + last name + @ptc.com
 * Examples: g.ngola@ptc.com, p.build@ptc.com
 */
export function validateEmailFormat(email: string): boolean {
  // Format: initial.nom@ptc.com (single letter + dot + name)
  const emailRegex = /^[a-z]\.[a-z]+@ptc\.com$/i;
  return emailRegex.test(email.toLowerCase());
}

/**
 * Generates an email address from a full name.
 * Format: initial.lastname@ptc.com
 * Example: "Glodi Ngola" → "g.ngola@ptc.com"
 */
export function generateEmailFromName(fullName: string): string {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  if (parts.length < 2) {
    throw new Error("Le nom complet doit contenir au moins un prénom et un nom");
  }
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  // Remove accents and special characters
  const normalizedLastName = lastName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  const normalizedFirstInitial = firstName[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return `${normalizedFirstInitial}.${normalizedLastName}@ptc.com`;
}

/**
 * Normalizes an email address to the correct format.
 * If the email is already valid, returns it as-is (lowercase).
 * Otherwise, attempts to generate a valid email from the input.
 */
export function normalizeEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  if (validateEmailFormat(normalized)) {
    return normalized;
  }
  // If it looks like a name, try to generate an email
  if (!normalized.includes("@")) {
    return generateEmailFromName(normalized);
  }
  return normalized;
}

/**
 * Generates a secure temporary password.
 */
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Authenticates a user with email and password.
 */
export async function login(
  email: string,
  password: string,
  ip?: string,
  userAgent?: string
): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    return { success: false, error: "Identifiants invalides" };
  }

  // Check if account is locked
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
    );
    await logAudit("login_fail", null, user.id, { reason: "account_locked", ip });
    return {
      success: false,
      error: `Compte temporairement verrouillé. Réessayez dans ${remainingMinutes} minute(s).`,
    };
  }

  // Check user status
  if (user.status === "DISABLED") {
    await logAudit("login_fail", null, user.id, { reason: "account_disabled", ip });
    return { success: false, error: "Ce compte a été désactivé" };
  }

  if (user.status === "PENDING") {
    await logAudit("login_fail", null, user.id, { reason: "account_pending", ip });
    return { success: false, error: "Ce compte n'a pas encore été activé" };
  }

  // Check password
  if (!user.passwordHash) {
    return { success: false, error: "Compte non configuré. Contactez l'administrateur." };
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    // Increment failed attempts
    const newAttempts = user.failedLoginAttempts + 1;
    const updates: Partial<typeof users.$inferInsert> = {
      failedLoginAttempts: newAttempts,
      updatedAt: new Date(),
    };

    // Lock account if max attempts reached
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    }

    await db.update(users).set(updates).where(eq(users.id, user.id));
    await logAudit("login_fail", null, user.id, { reason: "invalid_password", ip, attempts: newAttempts });

    return { success: false, error: "Identifiants invalides" };
  }

  // Successful login - reset failed attempts and update last login
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Create session
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
  };

  const token = await createSession(sessionUser, ip, userAgent);
  await setSessionCookie(token);
  await logAudit("login_success", user.id, null, { ip });

  return {
    success: true,
    user: sessionUser,
    mustChangePassword: user.mustChangePassword,
  };
}

/**
 * Logs out the current user.
 */
export async function logoutUser(userId: string): Promise<void> {
  await logAudit("logout", userId, null, {});
  await logout();
}

/**
 * Creates a new AGENT user (admin only).
 * If email is not provided, auto-generates from name.
 */
export async function createAgent(
  adminUserId: string,
  email: string | undefined,
  name: string,
  tempPassword?: string
): Promise<CreateUserResult> {
  // Auto-generate email from name if not provided
  let normalizedEmail: string;
  try {
    normalizedEmail = email 
      ? email.toLowerCase().trim() 
      : generateEmailFromName(name);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la génération de l'email" };
  }

  // Validate email format
  if (!validateEmailFormat(normalizedEmail)) {
    return { success: false, error: "Format d'email invalide. Utilisez le format initial.nom@ptc.com (ex: g.ngola@ptc.com)" };
  }

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return { success: false, error: "Cet email est déjà utilisé" };
  }

  // Generate or validate temp password
  const password = tempPassword || generateTempPassword();
  const validation = validatePassword(password);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(", ") };
  }

  const passwordHash = await hashPassword(password);
  const userId = randomUUID();

  // Create user
  await db.insert(users).values({
    id: userId,
    email: normalizedEmail,
    name,
    passwordHash,
    role: "AGENT",
    status: "PENDING",
    mustChangePassword: true,
  });

  await logAudit("user_create", adminUserId, userId, { email: normalizedEmail, role: "AGENT" });

  return {
    success: true,
    userId,
    email: normalizedEmail,
    tempPassword: password,
  };
}

/**
 * Activates a user account (admin only).
 */
export async function activateUser(adminUserId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  if (user.status === "ACTIVE") {
    return { success: false, error: "L'utilisateur est déjà actif" };
  }

  await db
    .update(users)
    .set({ status: "ACTIVE", updatedAt: new Date() })
    .where(eq(users.id, userId));

  await logAudit("user_activate", adminUserId, userId, {});

  return { success: true };
}

/**
 * Deactivates a user account (admin only).
 */
export async function deactivateUser(adminUserId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  // Prevent admin from deactivating themselves
  if (user.id === adminUserId) {
    return { success: false, error: "Vous ne pouvez pas désactiver votre propre compte" };
  }

  if (user.status === "DISABLED") {
    return { success: false, error: "L'utilisateur est déjà désactivé" };
  }

  await db
    .update(users)
    .set({ status: "DISABLED", updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Revoke all sessions for this user
  await revokeAllUserSessions(userId);

  await logAudit("user_deactivate", adminUserId, userId, {});

  return { success: true };
}

/**
 * Resets a user's password (admin only).
 */
export async function resetUserPassword(
  adminUserId: string,
  userId: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string; tempPassword?: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  const password = newPassword || generateTempPassword();
  const validation = validatePassword(password);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(", ") };
  }

  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Revoke all sessions for this user
  await revokeAllUserSessions(userId);

  await logAudit("user_reset_password", adminUserId, userId, {});

  return { success: true, tempPassword: password };
}

/**
 * Changes the current user's password.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.passwordHash) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  // Verify current password
  const validPassword = await verifyPassword(currentPassword, user.passwordHash);
  if (!validPassword) {
    return { success: false, error: "Mot de passe actuel incorrect" };
  }

  // Validate new password
  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(", ") };
  }

  // Prevent reuse of current password
  const samePassword = await verifyPassword(newPassword, user.passwordHash);
  if (samePassword) {
    return { success: false, error: "Le nouveau mot de passe doit être différent de l'ancien" };
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await logAudit("password_change", userId, null, {});

  return { success: true };
}

/**
 * Creates the first admin user if no users exist.
 */
export async function createInitialAdmin(
  email: string,
  password: string,
  name: string
): Promise<CreateUserResult> {
  // Check if any users exist
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .limit(1);

  if (existingUser) {
    return { success: false, error: "Un utilisateur existe déjà. Contactez l'administrateur." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate password
  const validation = validatePassword(password);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(", ") };
  }

  const passwordHash = await hashPassword(password);
  const userId = randomUUID();

  // Create admin user
  await db.insert(users).values({
    id: userId,
    email: normalizedEmail,
    name,
    passwordHash,
    role: "ADMIN",
    status: "ACTIVE",
    mustChangePassword: false,
  });

  await logAudit("user_create", userId, userId, { email: normalizedEmail, role: "ADMIN", initial: true });

  return { success: true, userId };
}
