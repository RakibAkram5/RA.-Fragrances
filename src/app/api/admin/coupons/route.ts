import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { couponCreateSchema } from "@/lib/validation/schemas";
import { createCoupon, listCoupons } from "@/lib/services/coupon-service";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await listCoupons();
    return jsonOk({ coupons });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const body = await parseJson(req, couponCreateSchema);
    const coupon = await createCoupon({
      code: body.code,
      type: body.type,
      value: body.value,
      minOrder: body.minOrder ?? null,
      maxDiscount: body.maxDiscount ?? null,
      expiresAt: body.expiresAt ?? null,
      usageLimit: body.usageLimit ?? null,
      perUserLimit: body.perUserLimit ?? null,
      active: body.active,
      categoryIds: body.categoryIds,
      productIds: body.productIds,
    });
    await logAudit({
      adminUserId: admin.id,
      action: "COUPON_CREATE",
      entity: "Coupon",
      entityId: coupon.id,
      meta: { code: coupon.code, type: coupon.type, value: coupon.value },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ id: coupon.id });
  } catch (err) {
    return mapRouteError(err);
  }
}
