import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireUser } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { checkoutSchema } from "@/lib/validation/schemas";
import { createOrder } from "@/lib/services/checkout-service";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const ip = clientIp(req);
    const rl = rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
    if (!rl.ok) return jsonOk({ error: "Too many orders placed recently. Please wait." }, { status: 429 });

    const user = await requireUser();
    const body = await parseJson(req, checkoutSchema);

    const order = await createOrder({
      userId: user.id,
      userEmail: user.email,
      items: body.items,
      couponCode: body.couponCode || null,
      address: {
        fullName: body.address.fullName,
        phone: body.address.phone,
        line1: body.address.line1,
        line2: body.address.line2 || null,
        city: body.address.city,
        province: body.address.province,
        postalCode: body.address.postalCode || null,
      },
      notes: body.notes || null,
    });

    return jsonOk({
      message: "Order confirmed.",
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency,
      },
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
