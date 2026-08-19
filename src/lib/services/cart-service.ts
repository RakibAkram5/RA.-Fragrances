import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import { roundMoney } from "@/lib/utils";

export interface CartIdentity {
  userId?: string;
  guestToken?: string;
}

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        include: { inventory: true, images: { where: { isPrimary: true }, take: 1 } },
      },
    },
  },
} as const;

export interface CartWithItems {
  id: string;
  items: {
    productId: string;
    quantity: number;
    product: {
      name: string;
      slug: string;
      price: number;
      compareAtPrice: number | null;
      size: string;
      status: string;
      inventory: { quantity: number } | null;
      images: { url: string; alt: string | null }[];
    };
  }[];
}

export async function getOrCreateCart(identity: CartIdentity) {
  if (identity.userId) {
    const existing = await prisma.cart.findUnique({
      where: { userId: identity.userId },
      include: CART_INCLUDE,
    });
    if (existing) return existing;
    return prisma.cart.create({
      data: { userId: identity.userId },
      include: CART_INCLUDE,
    });
  }

  const guestToken = identity.guestToken;
  if (!guestToken) {
    return prisma.cart.create({ data: {}, include: CART_INCLUDE });
  }
  const existing = await prisma.cart.findUnique({
    where: { guestToken },
    include: CART_INCLUDE,
  });
  if (existing) return existing;
  return prisma.cart.create({ data: { guestToken }, include: CART_INCLUDE });
}

export function toCartDto(cart: CartWithItems) {
  let subtotal = 0;
  let itemCount = 0;

  const items = cart.items
    .filter((item) => item.product && item.product.status === "ACTIVE")
    .map((item) => {
      const lineTotal = item.product.price * item.quantity;
      subtotal += lineTotal;
      itemCount += item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        compareAtPrice: item.product.compareAtPrice,
        size: item.product.size,
        image: item.product.images[0]?.url ?? null,
        stock: item.product.inventory?.quantity ?? 0,
        lineTotal,
      };
    });

  return {
    id: cart.id,
    items,
    subtotal: roundMoney(subtotal),
    itemCount,
  };
}

async function findProduct(productId: string) {
  return prisma.product.findFirst({
    where: { id: productId },
    include: { inventory: true },
  });
}

export async function addItem(cartId: string, productId: string, quantity: number) {
  const product = await findProduct(productId);
  if (!product || product.status !== "ACTIVE") {
    throw new ApiError(404, "Product not available.");
  }
  const stock = product.inventory?.quantity ?? 0;
  if (stock <= 0) throw new ApiError(409, "This product is out of stock.");

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });

  const target = Math.min(stock, (existing?.quantity ?? 0) + quantity);
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: target },
    create: { cartId, productId, quantity: Math.min(stock, quantity) },
  });

  return prisma.cart.findUnique({ where: { id: cartId }, include: CART_INCLUDE });
}

export async function updateItem(cartId: string, productId: string, quantity: number) {
  const product = await findProduct(productId);
  if (!product || product.status !== "ACTIVE") {
    throw new ApiError(404, "Product not available.");
  }
  const stock = product.inventory?.quantity ?? 0;
  if (stock <= 0) throw new ApiError(409, "This product is out of stock.");

  const clamped = Math.min(Math.max(1, quantity), stock);
  await prisma.cartItem.update({
    where: { cartId_productId: { cartId, productId } },
    data: { quantity: clamped },
  });

  return prisma.cart.findUnique({ where: { id: cartId }, include: CART_INCLUDE });
}

export async function removeItem(cartId: string, productId: string) {
  await prisma.cartItem
    .deleteMany({ where: { cartId, productId } })
    .catch(() => {});
  return prisma.cart.findUnique({ where: { id: cartId }, include: CART_INCLUDE });
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
  return prisma.cart.findUnique({ where: { id: cartId }, include: CART_INCLUDE });
}

/** Merge a guest cart into a user's cart on login. */
export async function mergeGuestCart(userId: string, guestToken?: string) {
  if (!guestToken) return;
  const guestCart = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = await getOrCreateCart({ userId });
  for (const item of guestCart.items) {
    await addItem(userCart.id, item.productId, item.quantity);
  }
  await prisma.cart.delete({ where: { id: guestCart.id } }).catch(() => {});
}
