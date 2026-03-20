/**
 * Password handling for local authentication.
 * Uses plaintext password comparison (development mode).
 * 
 * WARNING: This is NOT secure for production use.
 * Passwords are stored in plain text without hashing.
 */

// Password policy configuration - simplified for development
export const PASSWORD_POLICY = {
  minLength: 4,
  maxLength: 128,
  requireUppercase: false,
  requireLowercase: false,
  requireNumber: false,
  requireSpecial: false,
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a password against the policy.
 * Simplified validation for development purposes.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Le mot de passe est requis");
    return { valid: false, errors };
  }

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${PASSWORD_POLICY.minLength} caractères`);
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Le mot de passe ne doit pas dépasser ${PASSWORD_POLICY.maxLength} caractères`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Stores password in plain text (no hashing).
 * WARNING: Not secure for production use.
 */
export async function hashPassword(password: string): Promise<string> {
  // Return password as-is (plaintext storage)
  return password;
}

/**
 * Verifies a password against stored password.
 * Simple string comparison (no hash verification).
 */
export async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  // Simple plaintext comparison
  return password === storedPassword;
}
