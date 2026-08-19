import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError } from "@/lib/route-helpers";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request-meta";
import { listProducts } from "@/lib/services/product-service";

const SORTS = new Set(["newest", "price-asc", "price-desc", "rating", "popular", "featured"]);

function parseIntParam(v: string | null, fallback: number, max: number): number {
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 1), max);
}

export async function GET(req: NextRequest) {
  try {
    const rl = rateLimit(`public:products:${clientIp(req)}`, {
      limit: 120,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return jsonOk(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const sp = req.nextUrl.searchParams;
    const minPrice = sp.get("minPrice");
    const maxPrice = sp.get("maxPrice");

    const result = await listProducts({
      q: sp.get("q") ?? undefined,
      categorySlug: sp.get("category") ?? undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: sp.get("inStock") === "1",
      sort: SORTS.has(sp.get("sort") ?? "") ? (sp.get("sort") as string) : "newest",
      page: parseIntParam(sp.get("page"), 1, 1000),
      pageSize: parseIntParam(sp.get("pageSize"), 12, 60),
    });

    return jsonOk(result);
  } catch (err) {
    return mapRouteError(err);
  }
}
