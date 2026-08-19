import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/route-helpers";

/** Best-effort client IP extraction (behind proxies). */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function clientUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent")?.slice(0, 500) ?? "";
}

/**
 * CSRF protection for state-changing requests.
 *
 * All session cookies are `SameSite=Lax` and `HttpOnly`. In addition, we
 * reject state-changing requests whose `Origin` header (sent by browsers on
 * cross-origin requests) does not match the origin derived from the request's
 * own Host header. This is the standard "verify Origin" defense for same-site
 * JSON APIs and complements the SameSite cookie attribute.
 */
export function assertSafeRequest(req: NextRequest): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = req.headers.get("origin");
  if (!origin) {
    // Non-browser clients (curl, tests) don't send Origin. They also don't
    // carry the victim's cookies, so CSRF is not possible from them.
    return;
  }

  const host = req.headers.get("host");
  if (host && origin !== `http://${host}` && origin !== `https://${host}`) {
    throw new ApiError(403, "Invalid request origin.");
  }
}
