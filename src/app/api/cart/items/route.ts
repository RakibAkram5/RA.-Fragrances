import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson } from "@/lib/route-helpers";
import { resolveCartIdentity, GUEST_CART_COOKIE } from "@/lib/cart-context";
import {
  addItem,
  getOrCreateCart,
  removeItem,
  toCartDto,
  updateItem,
} from "@/lib/services/cart-service";
import { assertSafeRequest, clientIp } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { cartItemSchema } from "@/lib/validation/schemas";

function withGuestCookie(res: Response, newGuestToken?: string) {
  if (newGuestToken && res instanceof Response) {
    const headers = new Headers(res.headers);
    headers.append(
      "Set-Cookie",
      `${GUEST_CART_COOKIE}=${newGuestToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
    );
    return new Response(res.body, { status: res.status, headers });
  }
  return res;
}

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const rl = rateLimit(`cart:${clientIp(req)}`, { limit: 60, windowMs: 60_000 });
    if (!rl.ok) return jsonOk({ error: "Too many requests." }, { status: 429 });

    const body = await parseJson(req, cartItemSchema);
    const { identity, newGuestToken } = await resolveCartIdentity();
    const cart = await getOrCreateCart(identity);
    const updated = await addItem(cart.id, body.productId, body.quantity);
    const res = jsonOk({ cart: toCartDto(updated!) });
    return withGuestCookie(res, newGuestToken);
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const body = await parseJson(req, cartItemSchema);
    const { identity, newGuestToken } = await resolveCartIdentity();
    const cart = await getOrCreateCart(identity);
    const updated = await updateItem(cart.id, body.productId, body.quantity);
    const res = jsonOk({ cart: toCartDto(updated!) });
    return withGuestCookie(res, newGuestToken);
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const productId = req.nextUrl.searchParams.get("productId");
    if (!productId) {
      return jsonOk({ error: "productId is required." }, { status: 400 });
    }
    const { identity, newGuestToken } = await resolveCartIdentity();
    const cart = await getOrCreateCart(identity);
    const updated = await removeItem(cart.id, productId);
    const res = jsonOk({ cart: toCartDto(updated!) });
    return withGuestCookie(res, newGuestToken);
  } catch (err) {
    return mapRouteError(err);
  }
}
