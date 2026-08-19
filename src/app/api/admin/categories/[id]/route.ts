import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { categorySchema } from "@/lib/validation/schemas";
import {
  archiveCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/services/category-service";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJson(req, categorySchema.partial());
    await updateCategory(id, body);
    await logAudit({
      adminUserId: admin.id,
      action: body.status === "ARCHIVED" ? "CATEGORY_ARCHIVE" : "CATEGORY_UPDATE",
      entity: "Category",
      entityId: id,
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Category updated." });
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
    const action = req.nextUrl.searchParams.get("mode") === "archive" ? "archive" : "delete";
    if (action === "archive") {
      await archiveCategory(id);
      await logAudit({
        adminUserId: admin.id,
        action: "CATEGORY_ARCHIVE",
        entity: "Category",
        entityId: id,
        ip: clientIp(req),
        userAgent: clientUserAgent(req),
      });
      return jsonOk({ message: "Category archived." });
    }
    await deleteCategory(id);
    await logAudit({
      adminUserId: admin.id,
      action: "CATEGORY_DELETE",
      entity: "Category",
      entityId: id,
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Category deleted." });
  } catch (err) {
    return mapRouteError(err);
  }
}
