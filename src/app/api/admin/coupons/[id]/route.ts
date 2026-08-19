import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { couponUpdateSchema } from "@/lib/validation/schemas";
import { deactivateCoupon, deleteCoupon, updateCoupon } from "@/lib/services/coupon-service";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJson(req, couponUpdateSchema);
    await updateCoupon(id, {
      code: body.code,
      type: body.type,
      value: body.value,
      minOrder: body.minOrder,
      maxDiscount: body.maxDiscount,
      expiresAt: body.expiresAt,
      usageLimit: body.usageLimit,
      perUserLimit: body.perUserLimit,
      active: body.active,
      categoryIds: body.categoryIds,
      productIds: body.productIds,
    });
    await logAudit({
      adminUserId: admin.id,
      action: "COUPON_UPDATE",
      entity: "Coupon",
      entityId: id,
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Coupon updated." });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    const usageCount = await prisma.couponUsage.count({ where: { couponId: id } });
    if (usageCount > 0) {
      await deactivateCoupon(id);
      await logAudit({
        adminUserId: admin.id,
        action: "COUPON_DEACTIVATE",
        entity: "Coupon",
        entityId: id,
        ip: clientIp(req),
        userAgent: clientUserAgent(req),
      });
      return jsonOk({ message: "Coupon has usage history and was deactivated." });
    }

    await deleteCoupon(id);
    await logAudit({
      adminUserId: admin.id,
      action: "COUPON_DELETE",
      entity: "Coupon",
      entityId: id,
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Coupon deleted." });
  } catch (err) {
    return mapRouteError(err);
  }
}
