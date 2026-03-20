/**
 * Prestige Build Local Authentication
 * 
 * This module provides local authentication (email + password) for Prestige Build.
 * - No external auth providers (Clerk, Google, etc.)
 * - RBAC: ADMIN and AGENT roles
 * - Secure password hashing with bcrypt
 * - JWT-based sessions with httpOnly cookies
 * - Brute-force protection
 * - Audit logging
 */

export * from "./password";
export * from "./session";
export * from "./service";
