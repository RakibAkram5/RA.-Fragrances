import "server-only";

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z, type ZodTypeDef } from "zod";

import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/security/tokens";
import type { Role, UserStatus } from "@/generated/prisma/client";

/** Operational error with an HTTP status — never leaks internals. */
export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: Date;
}

export function jsonOk(data: Record<string, unknown> = {}, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, ...(details !== undefined ? { details } : {}) },
    { status },
  );
}

type AnyUser = {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: Date;
};

export function toSafeUser(user: AnyUser): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
}

/** Resolve the authenticated session (with user) from the request cookie. */
export async function getSession() {
  const store = await cookies();
  const name = process.env.SESSION_COOKIE_NAME || "ra_session";
  const token = store.get(name)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status !== "ACTIVE") return null;
  return session;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session) return null;
  return toSafeUser(session.user);
}

/** Requires an authenticated customer/admin. Throws ApiError(401) otherwise. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Authentication required.");
  return user;
}

/** Requires an admin. Throws ApiError(401/403) otherwise. */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ApiError(403, "Forbidden.");
  return user;
}

/** Parse + validate a JSON body against a Zod schema. */
export async function parseJson<T>(
  req: NextRequest,
  schema: z.ZodType<T, ZodTypeDef, unknown>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid request data.", parsed.error.flatten());
  }
  return parsed.data;
}

/** Convert any thrown error into a safe JSON response. */
export function mapRouteError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return jsonError(err.message, err.status, err.details);
  }
  if (err && typeof err === "object" && "issues" in err) {
    return jsonError("Invalid request data.", 400, (err as { issues: unknown }).issues);
  }
  if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002") {
    return jsonError("A record with those details already exists.", 409);
  }
  // Log the real error server-side only.
  console.error("[route error]", err);
  return jsonError("Something went wrong. Please try again.", 500);
}
