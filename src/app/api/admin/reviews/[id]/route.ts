import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { z } from "zod";
import { moderateReview } from "@/lib/services/review-service";
import { logAudit } from "@/lib/audit";

const moderateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJson(req, moderateSchema);
    await moderateReview(id, body.status);
    await logAudit({
      adminUserId: admin.id,
      action: "REVIEW_MODERATE",
      entity: "Review",
      entityId: id,
      meta: { status: body.status },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Review updated." });
  } catch (err) {
    return mapRouteError(err);
  }
}
