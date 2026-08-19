import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { restoreProduct } from "@/lib/services/product-service";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    await restoreProduct(id);
    await logAudit({
      adminUserId: admin.id,
      action: "PRODUCT_RESTORE",
      entity: "Product",
      entityId: id,
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Product restored." });
  } catch (err) {
    return mapRouteError(err);
  }
}
