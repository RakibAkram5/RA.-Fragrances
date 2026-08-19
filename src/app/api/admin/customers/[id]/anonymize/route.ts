import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { anonymizeCustomer } from "@/lib/services/customer-service";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    await anonymizeCustomer(id);
    await logAudit({
      adminUserId: admin.id,
      action: "CUSTOMER_ANONYMIZE",
      entity: "User",
      entityId: id,
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Customer deactivated and anonymised." });
  } catch (err) {
    return mapRouteError(err);
  }
}
