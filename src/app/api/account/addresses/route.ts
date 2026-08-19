import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireUser } from "@/lib/route-helpers";
import { assertSafeRequest } from "@/lib/security/request-meta";
import { addressSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return jsonOk({ addresses });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const user = await requireUser();
    const body = await parseJson(req, addressSchema);

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }
    const count = await prisma.address.count({ where: { userId: user.id } });

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: body.fullName,
        phone: body.phone,
        line1: body.line1,
        line2: body.line2 || null,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode || null,
        isDefault: body.isDefault ?? count === 0,
      },
    });
    return jsonOk({ address });
  } catch (err) {
    return mapRouteError(err);
  }
}
