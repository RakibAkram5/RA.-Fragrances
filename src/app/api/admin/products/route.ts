import type { NextRequest } from "next/server";

import { z } from "zod";
import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { productCreateSchema } from "@/lib/validation/schemas";
import { createProduct, listProducts } from "@/lib/services/product-service";
import { logAudit } from "@/lib/audit";
import type { ProductStatus } from "@/generated/prisma/client";

const STATUSES = new Set(["ACTIVE", "DRAFT", "ARCHIVED", "OUT_OF_STOCK"]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const statusParam = sp.get("status");

    const result = await listProducts({
      q: sp.get("q") ?? undefined,
      categorySlug: sp.get("category") ?? undefined,
      statuses: statusParam && STATUSES.has(statusParam) ? [statusParam as ProductStatus] : undefined,
      featured: sp.get("featured") === "1" ? true : sp.get("featured") === "0" ? false : undefined,
      sort: sp.get("sort") ?? "newest",
      page: Number(sp.get("page") ?? "1") || 1,
      pageSize: Number(sp.get("pageSize") ?? "20") || 20,
    });

    return jsonOk(result);
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const body = await parseJson(
      req,
      productCreateSchema.extend({
        initialStock: z.number().int().min(0).max(10_000_000).default(0),
      }),
    );

    const id = await createProduct({
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price,
      compareAtPrice: body.compareAtPrice ?? null,
      sku: body.sku,
      categoryId: body.categoryId ?? null,
      family: body.family ?? null,
      topNotes: body.topNotes,
      heartNotes: body.heartNotes,
      baseNotes: body.baseNotes,
      size: body.size,
      ingredients: body.ingredients,
      occasions: body.occasions,
      timeOfDay: body.timeOfDay ?? null,
      personality: body.personality ?? null,
      status: body.status,
      featured: body.featured,
      images: body.images ?? [],
      initialStock: body.initialStock,
    });

    await logAudit({
      adminUserId: admin.id,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: id,
      meta: { name: body.name, price: body.price },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });

    return jsonOk({ id });
  } catch (err) {
    return mapRouteError(err);
  }
}
