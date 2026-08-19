import type { NextRequest } from "next/server";

import { ApiError, jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { forgotPassword } from "@/lib/auth-service";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const ip = clientIp(req);
    const rl = rateLimit(`forgot:${ip}`, { limit: 3, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) throw new ApiError(429, "Too many requests. Please try again later.");

    const body = await parseJson(req, forgotPasswordSchema);
    await forgotPassword(body.email);
    // Always the same response — never reveal whether the email exists.
    return jsonOk({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
