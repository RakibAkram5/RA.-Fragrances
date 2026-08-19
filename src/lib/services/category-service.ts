import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import { slugify } from "@/lib/utils";
import type { CategoryStatus } from "@/generated/prisma/client";

export async function listCategories(opts: { includeArchived?: boolean } = {}) {
  return prisma.category.findMany({
    where: opts.includeArchived ? {} : { status: "ACTIVE" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({ where: { slug, status: "ACTIVE" } });
}

export async function assertUniqueCategorySlug(slug: string, excludeId?: string) {
  const clash = await prisma.category.findFirst({
    where: { slug, id: { not: excludeId } },
  });
  if (clash) throw new ApiError(409, "A category with this slug already exists.");
}

export async function createCategory(input: {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  status: CategoryStatus;
  sortOrder: number;
}) {
  const slug = slugify(input.slug) || slugify(input.name);
  await assertUniqueCategorySlug(slug);
  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      status: input.status,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateCategory(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    status: CategoryStatus;
    sortOrder: number;
  }>,
) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Category not found.");

  const slug = input.slug !== undefined ? slugify(input.slug) : existing.slug;
  if (input.slug !== undefined) await assertUniqueCategorySlug(slug, id);

  return prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
}

export async function archiveCategory(id: string) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Category not found.");
  await prisma.category.update({ where: { id }, data: { status: "ARCHIVED" } });
}

/** Hard delete. Products in the category become uncategorised (FK SetNull). */
export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Category not found.");
  await prisma.category.delete({ where: { id } });
}
