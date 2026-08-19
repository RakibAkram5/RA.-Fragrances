import type { NextRequest } from "next/server";

import {
  jsonError,
  jsonOk,
  mapRouteError,
  parseJson,
  requireAdmin,
} from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { productUpdateSchema } from "@/lib/validation/schemas";
import {
  deleteProduct,
  getProductAnyStatus,
  replaceProductImages,
  updateProduct,
} from "@/lib/services/product-service";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const product = await getProductAnyStatus(id);
    if (!product) return jsonError("Product not found.", 404);
    return jsonOk({
      product: {
        ...product,
        images: product.images,
        inventory: product.inventory,
      },
    });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJson(req, productUpdateSchema);

    const before = await prisma.product.findUnique({ where: { id } });
    if (!before) return jsonError("Product not found.", 404);

    await updateProduct(id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price,
      compareAtPrice: body.compareAtPrice,
      sku: body.sku,
      categoryId: body.categoryId,
      family: body.family,
      topNotes: body.topNotes,
      heartNotes: body.heartNotes,
      baseNotes: body.baseNotes,
      size: body.size,
      ingredients: body.ingredients,
      occasions: body.occasions,
      timeOfDay: body.timeOfDay,
      personality: body.personality,
      status: body.status,
      featured: body.featured,
    });

    if (body.images !== undefined) {
      await replaceProductImages(
        id,
        body.images.map((img) => ({ url: img.url, alt: img.alt ?? null })),
      );
    }

    const priceChanged = body.price !== undefined && body.price !== before.price;
    await logAudit({
      adminUserId: admin.id,
      action: body.status === "ARCHIVED" && before.status !== "ARCHIVED" ? "PRODUCT_ARCHIVE" : "PRODUCT_UPDATE",
      entity: "Product",
      entityId: id,
      meta: priceChanged
        ? { priceChanged: true, from: before.price, to: body.price }
        : { fields: Object.keys(body) },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });

    return jsonOk({ message: "Product updated." });
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
    await deleteProduct(id);

    await logAudit({
      adminUserId: admin.id,
      action: "PRODUCT_DELETE",
      entity: "Product",
      entityId: id,
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });
    return jsonOk({ message: "Product permanently deleted." });
  } catch (err) {
    return mapRouteError(err);
  }
}
