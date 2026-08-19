import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireUser } from "@/lib/route-helpers";
import { assertSafeRequest } from "@/lib/security/request-meta";
import { profileUpdateSchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk({ user });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const user = await requireUser();
    const body = await parseJson(req, profileUpdateSchema);
    await prisma.user.update({
      where: { id: user.id },
      data: { name: body.name, phone: body.phone || null },
    });
    return jsonOk({ message: "Profile updated." });
  } catch (err) {
    return mapRouteError(err);
  }
}
