import type { NextRequest } from "next/server";

import { ApiError, jsonOk, mapRouteError, parseJson, requireUser } from "@/lib/route-helpers";
import { assertSafeRequest } from "@/lib/security/request-meta";
import { addressSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseJson(req, addressSchema);

    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new ApiError(404, "Address not found.");

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    await prisma.address.update({
      where: { id },
      data: {
        fullName: body.fullName,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2 || null,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode || null,
        isDefault: body.isDefault ?? existing.isDefault,
      },
    });
    return jsonOk({ message: "Address updated." });
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
    const user = await requireUser();
    const { id } = await ctx.params;
    const result = await prisma.address.deleteMany({ where: { id, userId: user.id } });
    if (result.count === 0) throw new ApiError(404, "Address not found.");
    return jsonOk({ message: "Address removed." });
  } catch (err) {
    return mapRouteError(err);
  }
}
