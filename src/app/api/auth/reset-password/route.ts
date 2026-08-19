import type { NextRequest } from "next/server";

import { ApiError, jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { resetPassword } from "@/lib/auth-service";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const ip = clientIp(req);
    const rl = rateLimit(`reset:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) throw new ApiError(429, "Too many attempts. Please try again later.");

    const body = await parseJson(req, resetPasswordSchema);
    await resetPassword(body.token, body.password);
    return jsonOk({ message: "Password updated. Please sign in." });
  } catch (err) {
    return mapRouteError(err);
  }
}
