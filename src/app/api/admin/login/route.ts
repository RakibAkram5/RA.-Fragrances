import type { NextRequest } from "next/server";

import { ApiError, jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { loginSchema } from "@/lib/validation/schemas";
import { loginAdmin } from "@/lib/auth-service";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { isLocked, recordFailure, clearFailures } from "@/lib/security/brute-force";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const ip = clientIp(req);
    const rl = rateLimit(`adminlogin:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) throw new ApiError(429, "Too many attempts. Please try again later.");

    const body = await parseJson(req, loginSchema);
    const key = `admin:${body.email}|${ip}`;
    const lock = isLocked(key);
    if (lock.locked) {
      throw new ApiError(429, `Too many failed attempts. Try again in ${Math.ceil(lock.retryAfterSec / 60)} minutes.`);
    }

    try {
      const result = await loginAdmin(body.email, body.password, {
        ip,
        userAgent: clientUserAgent(req),
      });
      await logAudit({
        adminUserId: result.user.id,
        action: "ADMIN_LOGIN",
        ip,
        userAgent: clientUserAgent(req),
      });
      clearFailures(key);

      const res = jsonOk({ user: result.user });
      res.cookies.set(SESSION_COOKIE_NAME(), result.token, sessionCookieOptions(result.ttlMs));
      return res;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        // Track failures only for valid-credential-shape attempts.
        const user = await prisma.user.findUnique({ where: { email: body.email } });
        if (user && user.passwordHash) {
          const valid = await verifyPassword(body.password, user.passwordHash);
          if (valid) {
            await logAudit({
              adminUserId: user.id,
              action: "ADMIN_LOGIN_DENIED_NOT_ADMIN",
              ip,
              userAgent: clientUserAgent(req),
            });
          } else {
            recordFailure(key);
          }
        } else {
          recordFailure(key);
        }
      }
      throw err;
    }
  } catch (err) {
    return mapRouteError(err);
  }
}
