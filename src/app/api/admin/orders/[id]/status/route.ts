import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { orderStatusUpdateSchema } from "@/lib/validation/schemas";
import { updateOrderStatus } from "@/lib/services/order-service";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJson(req, orderStatusUpdateSchema);

    await updateOrderStatus(id, body.status, { note: body.note });

    await logAudit({
      adminUserId: admin.id,
      action: "ORDER_STATUS_CHANGE",
      entity: "Order",
      entityId: id,
      meta: { status: body.status },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });

    return jsonOk({ message: "Order status updated." });
  } catch (err) {
    return mapRouteError(err);
  }
}
