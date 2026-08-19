import { createHash, randomBytes, randomInt } from "node:crypto";

/**
 * Generates a high-entropy URL-safe token (32 random bytes, base64url).
 * Used for sessions, password reset and email verification tokens.
 */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Tokens are high-entropy, so a fast one-way digest (SHA-256) is appropriate
 * for storing them at rest. Passwords use a dedicated slow hash (bcrypt).
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Generate a public, human-friendly order number: RA-XXXX-XXXX. */
export function generateOrderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I
  let code = "";
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[randomInt(alphabet.length)];
  }
  return `RA-${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Generate a guest cart token (unauthenticated carts). */
export function generateGuestToken(): string {
  return randomBytes(16).toString("base64url");
}

/** Constant-time string comparison to avoid timing attacks on tokens. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return createHash("sha256").update(ab).digest().equals(
    createHash("sha256").update(bb).digest(),
  );
}
