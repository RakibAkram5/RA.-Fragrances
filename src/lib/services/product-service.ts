import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import { slugify, roundMoney } from "@/lib/utils";
import type { ProductStatus } from "@/generated/prisma/client";

export interface ProductListParams {
  q?: string;
  categorySlug?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  statuses?: ProductStatus[];
  featured?: boolean;
  sort?: string;
  page: number;
  pageSize: number;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  category: { id: string; name: string; slug: string } | null;
  family: string | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  size: string;
  ingredients: string[];
  occasions: string[];
  timeOfDay: string | null;
  personality: string | null;
  status: ProductStatus;
  featured: boolean;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  createdAt: Date;
  images: { url: string; alt: string | null }[];
  stock: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  discountPercent: number | null;
}

type ProductWithRelations = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  family: string | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  size: string;
  ingredients: string[];
  occasions: string[];
  timeOfDay: string | null;
  personality: string | null;
  status: ProductStatus;
  featured: boolean;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  createdAt: Date;
  images: { url: string; alt: string | null }[];
  category: { id: string; name: string; slug: string } | null;
  inventory: { quantity: number; lowStockThreshold: number } | null;
};

const RELATIONS = {
  images: { orderBy: { sortOrder: "asc" as const } },
  category: true,
  inventory: true,
};

export function computeStockStatus(
  quantity: number,
  threshold: number,
): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= threshold) return "low_stock";
  return "in_stock";
}

export function toProductDto(p: ProductWithRelations): ProductDto {
  const quantity = p.inventory?.quantity ?? 0;
  const threshold = p.inventory?.lowStockThreshold ?? 5;
  const discountPercent =
    p.compareAtPrice && p.compareAtPrice > p.price
      ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)
      : null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    sku: p.sku,
    category: p.category,
    family: p.family,
    topNotes: p.topNotes,
    heartNotes: p.heartNotes,
    baseNotes: p.baseNotes,
    size: p.size,
    ingredients: p.ingredients,
    occasions: p.occasions,
    timeOfDay: p.timeOfDay,
    personality: p.personality,
    status: p.status,
    featured: p.featured,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    salesCount: p.salesCount,
    createdAt: p.createdAt,
    images: p.images,
    stock: quantity,
    lowStockThreshold: threshold,
    stockStatus: computeStockStatus(quantity, threshold),
    discountPercent,
  };
}

function buildWhere(params: ProductListParams) {
  const AND: Record<string, unknown>[] = [];

  if (params.q) {
    const q = params.q.trim();
    AND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { family: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (params.categorySlug) {
    AND.push({ category: { slug: params.categorySlug } });
  }
  if (params.categoryId) {
    AND.push({ categoryId: params.categoryId });
  }
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (params.minPrice !== undefined) price.gte = params.minPrice;
    if (params.maxPrice !== undefined) price.lte = params.maxPrice;
    AND.push({ price });
  }
  if (params.inStock) {
    AND.push({ inventory: { quantity: { gt: 0 } } });
  }
  if (params.statuses && params.statuses.length > 0) {
    AND.push({ status: { in: params.statuses } });
  }
  if (params.featured !== undefined) {
    AND.push({ featured: params.featured });
  }

  return AND.length > 0 ? { AND } : {};
}

function buildOrderBy(sort?: string) {
  switch (sort) {
    case "price-asc":
      return { price: "asc" as const };
    case "price-desc":
      return { price: "desc" as const };
    case "rating":
      return [{ ratingAvg: "desc" as const }, { ratingCount: "desc" as const }];
    case "popular":
      return { salesCount: "desc" as const };
    case "featured":
      return [{ featured: "desc" as const }, { createdAt: "desc" as const }];
    case "newest":
    default:
      return { createdAt: "desc" as const };
  }
}

export async function listProducts(params: ProductListParams) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(Math.max(1, params.pageSize), 60);

  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: RELATIONS,
    }),
  ]);

  return {
    items: products.map(toProductDto),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Public product page — only ACTIVE products are reachable. */
export async function getProductBySlug(slug: string): Promise<ProductDto | null> {
  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: RELATIONS,
  });
  return product ? toProductDto(product) : null;
}

/** Admin/internal lookup by slug or id (any status). */
export async function getProductAnyStatus(
  identifier: string,
): Promise<ProductWithRelations | null> {
  const bySlug = await prisma.product.findUnique({
    where: { slug: identifier },
    include: RELATIONS,
  });
  if (bySlug) return bySlug;
  return prisma.product.findUnique({ where: { id: identifier }, include: RELATIONS });
}

export async function assertUniqueProductFields(
  slug: string,
  sku: string,
  excludeId?: string,
) {
  const clash = await prisma.product.findFirst({
    where: {
      id: { not: excludeId },
      OR: [{ slug }, { sku }],
    },
    select: { slug: true, sku: true },
  });
  if (clash) {
    if (clash.slug === slug) throw new ApiError(409, "A product with this slug already exists.");
    throw new ApiError(409, "A product with this SKU already exists.");
  }
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  sku: string;
  categoryId?: string | null;
  family?: string | null;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  size: string;
  ingredients: string[];
  occasions: string[];
  timeOfDay?: string | null;
  personality?: string | null;
  status: ProductStatus;
  featured: boolean;
  images?: { url: string; alt?: string | null }[];
  initialStock?: number;
}

export async function createProduct(input: CreateProductInput) {
  const slug = slugify(input.slug) || slugify(input.name);
  await assertUniqueProductFields(slug, input.sku.trim().toUpperCase());

  const initialStock = Math.max(0, input.initialStock ?? 0);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        price: input.price,
        compareAtPrice: input.compareAtPrice ?? null,
        sku: input.sku.trim().toUpperCase(),
        categoryId: input.categoryId || null,
        family: input.family || null,
        topNotes: input.topNotes,
        heartNotes: input.heartNotes,
        baseNotes: input.baseNotes,
        size: input.size,
        ingredients: input.ingredients,
        occasions: input.occasions,
        timeOfDay: input.timeOfDay || null,
        personality: input.personality || null,
        status: input.status,
        featured: input.featured,
        images: input.images?.length
          ? {
              create: input.images.map((img, i) => ({
                url: img.url,
                alt: img.alt ?? input.name,
                sortOrder: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
        inventory: {
          create: {
            quantity: initialStock,
            lowStockThreshold: 5,
          },
        },
      },
    });

    if (initialStock > 0) {
      await tx.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: "PURCHASE",
          quantityDelta: initialStock,
          previousQuantity: 0,
          newQuantity: initialStock,
          reason: "Initial stock",
        },
      });
    }

    return product.id;
  });
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "slug" | "sku">> & {
  slug?: string;
  sku?: string;
  status?: ProductStatus;
};

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Product not found.");

  const slug = input.slug !== undefined ? slugify(input.slug) : existing.slug;
  const sku = input.sku !== undefined ? input.sku.trim().toUpperCase() : existing.sku;

  if (input.slug !== undefined || input.sku !== undefined) {
    await assertUniqueProductFields(slug, sku, id);
  }

  const data: Record<string, unknown> = {};
  const pick = [
    "name",
    "description",
    "price",
    "compareAtPrice",
    "categoryId",
    "family",
    "topNotes",
    "heartNotes",
    "baseNotes",
    "size",
    "ingredients",
    "occasions",
    "timeOfDay",
    "personality",
    "status",
    "featured",
  ] as const;

  for (const key of pick) {
    if (key in input && input[key as keyof UpdateProductInput] !== undefined) {
      const value = input[key as keyof UpdateProductInput];
      if (key === "compareAtPrice" || key === "categoryId" || key === "family" ||
          key === "timeOfDay" || key === "personality") {
        data[key] = value ?? null;
      } else {
        data[key] = value;
      }
    }
  }

  if (input.slug !== undefined) data.slug = slug;
  if (input.sku !== undefined) data.sku = sku;

  if (input.status === "ARCHIVED") data.archivedAt = new Date();
  if (input.status && input.status !== "ARCHIVED") data.archivedAt = null;

  return prisma.product.update({ where: { id }, data: data as never });
}

export async function replaceProductImages(
  productId: string,
  images: { url: string; alt?: string | null }[],
) {
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    ...images.map((img, i) =>
      prisma.productImage.create({
        data: {
          productId,
          url: img.url,
          alt: img.alt ?? "RA Fragrance",
          sortOrder: i,
          isPrimary: i === 0,
        },
      }),
    ),
  ]);
}

export async function archiveProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Product not found.");
  await prisma.product.update({
    where: { id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
}

export async function restoreProduct(id: string) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true },
  });
  if (!existing) throw new ApiError(404, "Product not found.");
  const status =
    existing.inventory && existing.inventory.quantity <= 0 ? "OUT_OF_STOCK" : "ACTIVE";
  await prisma.product.update({ where: { id }, data: { status, archivedAt: null } });
}

/**
 * Permanent deletion — only allowed when there are no dependent records
 * (order items, reviews, etc.). Otherwise callers should archive instead.
 */
export async function deleteProduct(id: string) {
  const counts = await prisma.product.findUnique({
    where: { id },
    select: {
      _count: {
        select: { orderItems: true, reviews: true, cartItems: true, inventoryChanges: true },
      },
    },
  });
  if (!counts) throw new ApiError(404, "Product not found.");
  const { orderItems, reviews, cartItems, inventoryChanges } = counts._count;
  if (orderItems + reviews + cartItems + inventoryChanges > 0) {
    throw new ApiError(
      409,
      "This product has associated orders/reviews and cannot be permanently deleted. Archive it instead.",
    );
  }
  await prisma.product.delete({ where: { id } });
}

export async function incrementSales(productId: string, quantity: number) {
  await prisma.product.update({
    where: { id: productId },
    data: { salesCount: { increment: quantity } },
  });
}

export function discountAmount(price: number, compareAtPrice: number | null): number {
  return roundMoney(Math.max(0, (compareAtPrice ?? price) - price));
}
