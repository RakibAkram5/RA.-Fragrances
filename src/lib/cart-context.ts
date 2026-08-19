import "server-only";

import { cookies } from "next/headers";
import { getSession } from "@/lib/route-helpers";
import { generateGuestToken } from "@/lib/security/tokens";
import type { CartIdentity } from "@/lib/services/cart-service";

export const GUEST_CART_COOKIE = "ra_cart_token";

export interface ResolvedCart {
  identity: CartIdentity;
  newGuestToken?: string;
}

export async function resolveCartIdentity(): Promise<ResolvedCart> {
  const session = await getSession();
  if (session) {
    return { identity: { userId: session.userId } };
  }
  const store = await cookies();
  const existing = store.get(GUEST_CART_COOKIE)?.value;
  if (existing) {
    return { identity: { guestToken: existing } };
  }
  const token = generateGuestToken();
  return { identity: { guestToken: token }, newGuestToken: token };
}
