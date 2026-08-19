import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { inventoryAdjustSchema } from "@/lib/validation/schemas";
import { setStock } from "@/lib/services/inventory-service";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ productId: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { productId } = await ctx.params;
    const body = await parseJson(req, inventoryAdjustSchema);

    const result = await setStock(productId, body.quantity, body.type, {
      adminUserId: admin.id,
      reason: body.reason,
      note: body.note,
    });

    await logAudit({
      adminUserId: admin.id,
      action: "INVENTORY_ADJUST",
      entity: "Product",
      entityId: productId,
      meta: {
        type: body.type,
        previous: result.previous,
        delta: result.delta,
        next: result.next,
      },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });

    return jsonOk({ previous: result.previous, delta: result.delta, next: result.next });
  } catch (err) {
    return mapRouteError(err);
  }
}
