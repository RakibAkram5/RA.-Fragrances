import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import {
  createSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  generateToken,
  hashToken,
} from "@/lib/security/tokens";
import {
  clearFailures,
  isLocked,
  recordFailure,
} from "@/lib/security/brute-force";
import { sendEmail } from "@/lib/email/email";
import { passwordResetEmail, verificationEmail } from "@/lib/email/templates";

const APP_URL = () => process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export interface LoginResult {
  token: string;
  expiresAt: Date;
  ttlMs: number;
  user: { id: string; name: string; email: string; role: string };
}

async function authenticate(
  email: string,
  password: string,
  opts: { ip: string; userAgent: string; requireAdmin: boolean },
): Promise<LoginResult> {
  const key = `${email}|${opts.ip}`;
  const lock = isLocked(key);
  if (lock.locked) {
    throw new ApiError(429, `Too many failed attempts. Try again in ${Math.ceil(lock.retryAfterSec / 60)} minutes.`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    user &&
    user.passwordHash &&
    user.status === "ACTIVE" &&
    (await verifyPassword(password, user.passwordHash));

  if (!valid) {
    const res = recordFailure(key);
    if (res.locked) {
      throw new ApiError(429, "Too many failed attempts. Try again later.");
    }
    throw new ApiError(401, "Invalid email or password.");
  }

  if (opts.requireAdmin && user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access only.");
  }

  clearFailures(key);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const session = await createSession(user.id, {
    ip: opts.ip,
    userAgent: opts.userAgent,
    admin: user.role === "ADMIN",
  });

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    ttlMs: session.ttlMs,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function loginCustomer(
  email: string,
  password: string,
  opts: { ip: string; userAgent: string },
) {
  return authenticate(email, password, { ...opts, requireAdmin: false });
}

export async function loginAdmin(
  email: string,
  password: string,
  opts: { ip: string; userAgent: string },
) {
  return authenticate(email, password, { ...opts, requireAdmin: true });
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  ip: string;
  userAgent: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone || null,
      role: "CUSTOMER",
    },
  });

  // Verification token + email (delivery is provider-dependent).
  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const link = `${APP_URL()}/account/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({ to: input.email, ...verificationEmail(link) }).catch((e) => {
    console.error("[email] verification send failed", e);
  });

  return { userId: user.id, requiresVerification: true };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, "This verification link is invalid or has expired.");
  }
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) {
    // Always succeed to avoid account enumeration.
    return;
  }
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const link = `${APP_URL()}/account/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({ to: email, ...verificationEmail(link) }).catch(() => {});
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") {
    // Generic response — do not reveal whether the email exists.
    return;
  }
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const link = `${APP_URL()}/account/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({ to: email, ...passwordResetEmail(link) }).catch(() => {});
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, "This reset link is invalid or has expired.");
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);
}
