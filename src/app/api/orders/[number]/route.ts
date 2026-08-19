import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireUser } from "@/lib/route-helpers";
import { getCustomerOrder, toOrderDto } from "@/lib/services/order-service";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ number: string }> },
) {
  try {
    const user = await requireUser();
    const { number } = await ctx.params;
    // Ownership is enforced by getCustomerOrder (where { orderNumber, userId }).
    const order = await getCustomerOrder(number, user.id);
    return jsonOk({ order: toOrderDto(order) });
  } catch (err) {
    return mapRouteError(err);
  }
}
