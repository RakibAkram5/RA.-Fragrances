import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { listReviewsAdmin } from "@/lib/services/review-service";
import type { ReviewStatus } from "@/generated/prisma/client";

const STATUSES = new Set(["PENDING", "APPROVED", "REJECTED", "HIDDEN"]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const statusParam = sp.get("status");
    const result = await listReviewsAdmin({
      status: statusParam && STATUSES.has(statusParam) ? (statusParam as ReviewStatus) : undefined,
      page: Number(sp.get("page") ?? "1") || 1,
      pageSize: Number(sp.get("pageSize") ?? "20") || 20,
    });
    return jsonOk(result);
  } catch (err) {
    return mapRouteError(err);
  }
}
