import type { NextRequest } from "next/server";

import {
  ApiError,
  jsonOk,
  mapRouteError,
  parseJson,
} from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { registerSchema } from "@/lib/validation/schemas";
import { registerUser } from "@/lib/auth-service";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const ip = clientIp(req);
    const rl = rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) throw new ApiError(429, "Too many sign-up attempts. Please try again later.");

    const body = await parseJson(req, registerSchema);
    await registerUser({ ...body, ip, userAgent: clientUserAgent(req) });

    return jsonOk({
      message: "Account created. Please verify your email address.",
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
