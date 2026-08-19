import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { categorySchema } from "@/lib/validation/schemas";
import { createCategory, listCategories } from "@/lib/services/category-service";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await listCategories({ includeArchived: true });
    return jsonOk({ categories });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const body = await parseJson(req, categorySchema);
    const category = await createCategory(body);
    await logAudit({
      adminUserId: admin.id,
      action: "CATEGORY_CREATE",
      entity: "Category",
      entityId: category.id,
      meta: { name: category.name },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ id: category.id });
  } catch (err) {
    return mapRouteError(err);
  }
}
