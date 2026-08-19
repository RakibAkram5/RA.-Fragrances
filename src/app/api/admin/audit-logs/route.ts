import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const page = Number(sp.get("page") ?? "1") || 1;
    const pageSize = Math.min(Number(sp.get("pageSize") ?? "50") || 50, 200);

    const [total, items] = await Promise.all([
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { admin: { select: { name: true, email: true } } },
      }),
    ]);

    return jsonOk({
      items: items.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        meta: l.meta,
        ip: l.ip,
        userAgent: l.userAgent,
        createdAt: l.createdAt,
        adminName: l.admin?.name ?? null,
      })),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
