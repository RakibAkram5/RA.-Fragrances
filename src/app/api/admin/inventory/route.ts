import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { listInventory, lowStockProducts } from "@/lib/services/inventory-service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    if (sp.get("lowStock") === "1") {
      const items = await lowStockProducts();
      return jsonOk({ items });
    }
    const result = await listInventory({
      q: sp.get("q") ?? undefined,
      lowStockOnly: sp.get("lowStockOnly") === "1",
      outOfStockOnly: sp.get("outOfStockOnly") === "1",
      page: Number(sp.get("page") ?? "1") || 1,
      pageSize: Number(sp.get("pageSize") ?? "20") || 20,
    });
    return jsonOk(result);
  } catch (err) {
    return mapRouteError(err);
  }
}
