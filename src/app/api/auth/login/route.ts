import type { NextRequest } from "next/server";

import { ApiError, jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { loginSchema } from "@/lib/validation/schemas";
import { loginCustomer } from "@/lib/auth-service";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/services/cart-service";

const GUEST_CART_COOKIE = "ra_cart_token";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const ip = clientIp(req);
    const rl = rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) throw new ApiError(429, "Too many attempts. Please try again later.");

    const body = await parseJson(req, loginSchema);
    const result = await loginCustomer(body.email, body.password, {
      ip,
      userAgent: clientUserAgent(req),
    });

    // Merge any guest cart into the customer's cart.
    const guestToken = req.cookies.get(GUEST_CART_COOKIE)?.value;
    if (guestToken) {
      await mergeGuestCart(result.user.id, guestToken).catch(() => {});
    }

    const res = jsonOk({ user: result.user });
    res.cookies.set(SESSION_COOKIE_NAME(), result.token, sessionCookieOptions(result.ttlMs));
    res.cookies.set(GUEST_CART_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return mapRouteError(err);
  }
}
