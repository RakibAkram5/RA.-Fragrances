import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { z } from "zod";
import { recommendProducts } from "@/lib/services/quiz-service";

const quizSchema = z.object({
  timeOfDay: z.enum(["day", "night", "any"]),
  character: z.enum(["fresh", "warm", "any"]),
  intensity: z.enum(["subtle", "bold", "any"]),
  setting: z.enum(["office", "casual", "any"]),
  vibe: z.enum(["clean", "mysterious", "any"]),
  occasion: z.enum(["everyday", "special", "any"]),
});

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const rl = rateLimit(`quiz:${clientIp(req)}`, { limit: 30, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return jsonOk({ error: "Too many requests." }, { status: 429 });

    const body = await parseJson(req, quizSchema);
    const recommendations = await recommendProducts(body);
    return jsonOk({ recommendations });
  } catch (err) {
    return mapRouteError(err);
  }
}
