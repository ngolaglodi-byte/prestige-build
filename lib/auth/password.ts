/**
 * Password hashing and verification using bcryptjs.
 * Provides secure password handling for local authentication.
 */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Password policy configuration
export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a password against the policy.
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

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une lettre majuscule");
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une lettre minuscule");
  }

  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }

  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Hashes a password using bcrypt with secure salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
