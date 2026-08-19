import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { couponValidateSchema } from "@/lib/validation/schemas";
import { validateCoupon } from "@/lib/services/coupon-service";
import { resolveCartIdentity } from "@/lib/cart-context";
import { getOrCreateCart } from "@/lib/services/cart-service";
import { roundMoney } from "@/lib/utils";
import { getCurrentUser } from "@/lib/route-helpers";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const rl = rateLimit(`coupon:${clientIp(req)}`, { limit: 30, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return jsonOk({ error: "Too many attempts. Please try again later." }, { status: 429 });

    const body = await parseJson(req, couponValidateSchema);

    // Load the cart server-side so the client can never inflate the subtotal.
    const { identity } = await resolveCartIdentity();
    const cart = await getOrCreateCart(identity);
    const items = cart.items
      .filter((i) => i.product.status === "ACTIVE")
      .map((i) => ({
        productId: i.productId,
        categoryId: i.product.categoryId ?? null,
        lineTotal: i.product.price * i.quantity,
      }));
    const subtotal = roundMoney(items.reduce((s, i) => s + i.lineTotal, 0));

    const user = await getCurrentUser();
    const result = await validateCoupon(body.code, {
      subtotal,
      userId: user?.id,
      items,
    });

    return jsonOk({
      valid: true,
      code: result.coupon.code,
      discount: result.discount,
      eligibleSubtotal: result.eligibleSubtotal,
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
