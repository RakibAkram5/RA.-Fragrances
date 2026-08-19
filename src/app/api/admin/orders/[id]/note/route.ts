import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { orderNoteSchema } from "@/lib/validation/schemas";
import { addOrderNote } from "@/lib/services/order-service";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJson(req, orderNoteSchema);
    await addOrderNote(id, body.note);
    await logAudit({
      adminUserId: admin.id,
      action: "ORDER_NOTE",
      entity: "Order",
      entityId: id,
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Note added." });
  } catch (err) {
    return mapRouteError(err);
  }
}
