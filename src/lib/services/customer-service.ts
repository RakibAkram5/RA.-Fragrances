import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import type { Role, UserStatus } from "@/generated/prisma/client";

export async function listCustomers(params: {
  q?: string;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(Math.max(1, params.pageSize), 100);

  const AND: Record<string, unknown>[] = [];
  if (params.q) {
    AND.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { email: { contains: params.q, mode: "insensitive" } },
        { phone: { contains: params.q, mode: "insensitive" } },
      ],
    });
  }
  const where = AND.length ? { AND } : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);

  return { items: users, total, page, pageSize };
}

export async function getCustomer(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!user) throw new ApiError(404, "Customer not found.");
  return user;
}

export async function updateCustomer(
  id: string,
  input: Partial<{ name: string; phone?: string | null; status: UserStatus; role: Role }>,
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "Customer not found.");
  return prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
    },
  });
}

/**
 * Deactivate/anonymise a customer while preserving order records. Personal
 * data is scrubbed, sessions and tokens are destroyed, and the account can
 * no longer sign in. Orders are retained for operational/legal reasons.
 */
export async function anonymizeCustomer(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "Customer not found.");

  await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: {
        status: "ANONYMIZED",
        name: "Anonymized Customer",
        email: `anonymized-${id}@deleted.invalid`,
        phone: null,
        passwordHash: null,
        emailVerifiedAt: null,
      },
    }),
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: id } }),
    prisma.address.deleteMany({ where: { userId: id } }),
    prisma.cart.deleteMany({ where: { userId: id } }),
  ]);
}
