import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { assertSafeRequest } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyEmailSchema } from "@/lib/validation/schemas";
import { verifyEmailToken } from "@/lib/auth-service";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`verify:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return jsonOk({ message: "Too many attempts. Please try again later." });

    const body = await parseJson(req, verifyEmailSchema);
    await verifyEmailToken(body.token);
    return jsonOk({ message: "Email verified. Thank you." });
  } catch (err) {
    return mapRouteError(err);
  }
}
