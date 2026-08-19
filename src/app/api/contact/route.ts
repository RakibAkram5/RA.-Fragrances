import type { NextRequest } from "next/server";

import { ApiError, jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { contactSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const ip = clientIp(req);
    const rl = rateLimit(`contact:${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });
    if (!rl.ok) throw new ApiError(429, "Too many messages. Please try again later.");

    const body = await parseJson(req, contactSchema);

    // Honeypot: if the hidden field was filled, silently drop the spam.
    if (body.website) return jsonOk({ message: "Thank you for your message." });

    await prisma.contactMessage.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        subject: body.subject || null,
        message: body.message,
      },
    });

    return jsonOk({ message: "Thank you for your message. We will be in touch soon." });
  } catch (err) {
    return mapRouteError(err);
  }
}
