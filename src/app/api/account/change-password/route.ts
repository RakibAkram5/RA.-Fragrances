import type { NextRequest } from "next/server";

import { ApiError, jsonOk, mapRouteError, parseJson, requireUser } from "@/lib/route-helpers";
import { assertSafeRequest } from "@/lib/security/request-meta";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/route-helpers";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const user = await requireUser();
    const body = await parseJson(req, changePasswordSchema);

    const record = await prisma.user.findUnique({ where: { id: user.id } });
    if (
      !record?.passwordHash ||
      !(await verifyPassword(body.currentPassword, record.passwordHash))
    ) {
      throw new ApiError(400, "Current password is incorrect.");
    }

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    // Invalidate every session except the current one (security best practice).
    const session = await getSession();
    await prisma.session.deleteMany({
      where: { userId: user.id, id: session ? { not: session.id } : undefined },
    });

    return jsonOk({ message: "Password changed." });
  } catch (err) {
    return mapRouteError(err);
  }
}
