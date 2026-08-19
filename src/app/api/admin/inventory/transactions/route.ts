import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { listInventoryTransactions } from "@/lib/services/inventory-service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const result = await listInventoryTransactions({
      productId: sp.get("productId") ?? undefined,
      page: Number(sp.get("page") ?? "1") || 1,
      pageSize: Number(sp.get("pageSize") ?? "20") || 20,
    });
    return jsonOk(result);
  } catch (err) {
    return mapRouteError(err);
  }
}
