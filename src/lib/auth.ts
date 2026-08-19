import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/security/tokens";

const PASSWORD_HASH_COST = Number(process.env.PASSWORD_HASH_COST || 10);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_COST);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const SESSION_COOKIE_NAME = () =>
  process.env.SESSION_COOKIE_NAME || "ra_session";

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
  admin?: boolean;
}

/**
 * Create a database-backed session and return the raw cookie token.
 * Only the SHA-256 digest of the token is stored.
 */
export async function createSession(userId: string, meta: SessionMeta = {}) {
  const token = generateToken();
  const ttlMs = meta.admin
    ? Number(process.env.ADMIN_SESSION_MAX_AGE_HOURS || 8) * 60 * 60 * 1000
    : Number(process.env.SESSION_MAX_AGE_DAYS || 30) * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  return { token, expiresAt, ttlMs };
}

export function sessionCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

export async function destroySessionByToken(token: string): Promise<void> {
  await prisma.session
    .delete({ where: { tokenHash: hashToken(token) } })
    .catch(() => {});
}

/** Invalidate every session belonging to a user (logout-everywhere / reset). */
export async function destroyAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
