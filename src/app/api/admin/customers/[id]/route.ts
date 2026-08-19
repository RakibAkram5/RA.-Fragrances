import type { NextRequest } from "next/server";

import { jsonError, jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { customerUpdateSchema } from "@/lib/validation/schemas";
import { getCustomer, updateCustomer } from "@/lib/services/customer-service";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const customer = await getCustomer(id);
    if (!customer) return jsonError("Customer not found.", 404);
    return jsonOk({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        status: customer.status,
        emailVerifiedAt: customer.emailVerifiedAt,
        createdAt: customer.createdAt,
        lastLoginAt: customer.lastLoginAt,
        orderCount: customer._count.orders,
        reviewCount: customer._count.reviews,
        addresses: customer.addresses,
      },
    });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJson(req, customerUpdateSchema);
    await updateCustomer(id, body);
    await logAudit({
      adminUserId: admin.id,
      action: "CUSTOMER_UPDATE",
      entity: "User",
      entityId: id,
      meta: { fields: Object.keys(body) },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Customer updated." });
  } catch (err) {
    return mapRouteError(err);
  }
}
