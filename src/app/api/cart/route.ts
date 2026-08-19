import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError } from "@/lib/route-helpers";
import { resolveCartIdentity, GUEST_CART_COOKIE } from "@/lib/cart-context";
import {
  clearCart,
  getOrCreateCart,
  toCartDto,
} from "@/lib/services/cart-service";
import { assertSafeRequest } from "@/lib/security/request-meta";

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

export async function GET() {
  try {
    const { identity, newGuestToken } = await resolveCartIdentity();
    const cart = await getOrCreateCart(identity);
    const res = jsonOk({ cart: toCartDto(cart) });
    return withGuestCookie(res, newGuestToken);
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const { identity, newGuestToken } = await resolveCartIdentity();
    const cart = await getOrCreateCart(identity);
    const cleared = await clearCart(cart.id);
    const res = jsonOk({ cart: toCartDto(cleared!) });
    return withGuestCookie(res, newGuestToken);
  } catch (err) {
    return mapRouteError(err);
  }
}
