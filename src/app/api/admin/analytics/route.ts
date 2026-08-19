import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import {
  dashboardMetrics,
  orderStatusDistribution,
  revenueAndOrdersOverTime,
  topProducts,
} from "@/lib/services/analytics-service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const days = Math.min(Math.max(Number(sp.get("days") ?? "30") || 30, 7), 90);

    const [metrics, overTime, top, statusDistribution] = await Promise.all([
      dashboardMetrics(),
      revenueAndOrdersOverTime(days),
      topProducts(5),
      orderStatusDistribution(),
    ]);

    return jsonOk({ metrics, overTime, topProducts: top, statusDistribution });
  } catch (err) {
    return mapRouteError(err);
  }
}
