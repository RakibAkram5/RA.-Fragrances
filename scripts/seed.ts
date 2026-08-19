import bcrypt from "bcryptjs";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, ProductStatus, OrderStatus } from "../src/generated/prisma/client";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://ra:ra_local_dev_secret@127.0.0.1:5432/ra";

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@ra-fragrances.pk";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";

async function main() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log("[seed] products already present — skipping");
    return;
  }

  const cost = Number(process.env.PASSWORD_HASH_COST || 10);

  // ── Admin ──────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, cost);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: "RA Admin",
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    },
  });

  // ── Demo customer ──────────────────────────────────────────
  const customerPasswordHash = await bcrypt.hash("Customer@123", cost);
  const customer = await prisma.user.upsert({
    where: { email: "ayesha@example.com" },
    update: {},
    create: {
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      passwordHash: customerPasswordHash,
      phone: "03001234567",
      emailVerifiedAt: new Date(),
    },
  });

  // ── Categories ─────────────────────────────────────────────
  const [edp, discovery, best, arrivals] = await Promise.all([
    prisma.category.create({
      data: { name: "Eau de Parfum", slug: "eau-de-parfum", sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: "Discovery Sets", slug: "discovery-sets", sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: "Best Sellers", slug: "best-sellers", sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: "New Arrivals", slug: "new-arrivals", sortOrder: 4 },
    }),
  ]);

  // ── Products ───────────────────────────────────────────────
  interface SeedProduct {
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    sku: string;
    categoryId: string;
    family: string;
    topNotes: string[];
    heartNotes: string[];
    baseNotes: string[];
    size: string;
    ingredients: string[];
    occasions: string[];
    timeOfDay: string;
    personality: string;
    description: string;
    featured: boolean;
    images: { url: string; alt: string }[];
    stock: number;
  }

  const products: SeedProduct[] = [
    {
      name: "RA NOIR",
      slug: "ra-noir",
      price: 1890,
      sku: "RA-NOIR-50",
      categoryId: edp.id,
      family: "Woody Spicy",
      topNotes: ["Bergamot", "Pink Pepper"],
      heartNotes: ["Cedarwood", "Vetiver"],
      baseNotes: ["Amber", "Musk"],
      size: "50ml",
      ingredients: ["Alcohol Denat.", "Parfum (Fragrance)", "Aqua", "Benzyl Salicylate", "Limonene", "Linalool"],
      occasions: ["Evening", "Formal", "Date Night"],
      timeOfDay: "Night",
      personality: "Bold, confident, quietly intense. A dark signature for those who own the room without raising their voice.",
      description:
        "RA NOIR is a confident, woody-spicy composition built around cedarwood, vetiver and a warm amber base. It is crafted to be present without being loud — a dark, self-assured signature that lingers in the moments people remember.",
      featured: true,
      images: [
        { url: "/brand/products/ra-noir-1.jpg", alt: "RA NOIR 50ml Eau de Parfum bottle" },
        { url: "/brand/products/ra-noir-2.jpg", alt: "RA NOIR bottle with gift box" },
      ],
      stock: 48,
    },
    {
      name: "RA AMBRE",
      slug: "ra-ambre",
      price: 1890,
      sku: "RA-AMBRE-50",
      categoryId: edp.id,
      family: "Oriental",
      topNotes: ["Cardamom", "Saffron"],
      heartNotes: ["Amber", "Rose"],
      baseNotes: ["Oud", "Vanilla"],
      size: "50ml",
      ingredients: ["Alcohol Denat.", "Parfum (Fragrance)", "Aqua", "Coumarin", "Citronellol", "Geraniol"],
      occasions: ["Evening", "Special Occasion", "Date Night"],
      timeOfDay: "Night",
      personality: "Warm, enveloping and refined. An amber-oud warmth with a soft rose heart for evenings that matter.",
      description:
        "RA AMBRE wraps saffron, amber and a whisper of rose around a smooth oud and vanilla base. Warm and enveloping, it is composed for special evenings and cooler seasons.",
      featured: true,
      images: [{ url: "/brand/products/ra-ambre-1.jpg", alt: "RA AMBRE 50ml Eau de Parfum bottle" }],
      stock: 24,
    },
    {
      name: "RA VERT",
      slug: "ra-vert",
      price: 1790,
      compareAtPrice: 1890,
      sku: "RA-VERT-50",
      categoryId: edp.id,
      family: "Fresh Citrus",
      topNotes: ["Bergamot", "Lemon"],
      heartNotes: ["Lavender", "Geranium"],
      baseNotes: ["White Musk", "Vetiver"],
      size: "50ml",
      ingredients: ["Alcohol Denat.", "Parfum (Fragrance)", "Aqua", "Linalool", "Citral", "Limonene"],
      occasions: ["Everyday", "Office", "Casual"],
      timeOfDay: "Day",
      personality: "Clean, crisp and effortless. A bright citrus opening that settles into a calm, professional musk.",
      description:
        "RA VERT is a clean, fresh composition of bergamot and lemon over lavender and white musk. Built for everyday wear — office mornings, casual days and everything in between.",
      featured: false,
      images: [{ url: "/brand/products/ra-vert-1.jpg", alt: "RA VERT 50ml Eau de Parfum bottle" }],
      stock: 12,
    },
    {
      name: "RA SABLE",
      slug: "ra-sable",
      price: 1890,
      sku: "RA-SABLE-50",
      categoryId: edp.id,
      family: "Aromatic Spicy",
      topNotes: ["Black Pepper", "Nutmeg"],
      heartNotes: ["Sandalwood", "Leather"],
      baseNotes: ["Tonka Bean", "Patchouli"],
      size: "50ml",
      ingredients: ["Alcohol Denat.", "Parfum (Fragrance)", "Aqua", "Coumarin", "Eugenol", "Linalool"],
      occasions: ["Evening", "Formal", "Everyday"],
      timeOfDay: "Any",
      personality: "Structured and composed. A leather-and-sandalwood character with a warm tonka finish.",
      description:
        "RA SABLE balances black pepper and nutmeg with sandalwood and a soft leather accord, grounded by tonka bean and patchouli. Structured, composed and unmistakably present.",
      featured: false,
      images: [{ url: "/brand/products/ra-sable-1.jpg", alt: "RA SABLE 50ml Eau de Parfum bottle" }],
      stock: 30,
    },
    {
      name: "RA Discovery Set",
      slug: "ra-discovery-set",
      price: 2490,
      sku: "RA-DISC-5X5",
      categoryId: discovery.id,
      family: "Mixed",
      topNotes: ["Assorted"],
      heartNotes: ["Assorted"],
      baseNotes: ["Assorted"],
      size: "5 × 5ml",
      ingredients: ["Alcohol Denat.", "Parfum (Fragrance)", "Aqua"],
      occasions: ["Everyday", "Special Occasion"],
      timeOfDay: "Any",
      personality: "Explore the RA collection — five 5ml samples to find the scent that is yours.",
      description:
        "The RA Discovery Set includes five 5ml samples of our core compositions, so you can live with each scent before choosing a full bottle. Presented in a matte black case.",
      featured: false,
      images: [{ url: "/brand/products/ra-discovery-1.jpg", alt: "RA Discovery Set with five 5ml samples" }],
      stock: 40,
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        sku: p.sku,
        categoryId: p.categoryId,
        family: p.family,
        topNotes: p.topNotes,
        heartNotes: p.heartNotes,
        baseNotes: p.baseNotes,
        size: p.size,
        ingredients: p.ingredients,
        occasions: p.occasions,
        timeOfDay: p.timeOfDay,
        personality: p.personality,
        status: ProductStatus.ACTIVE,
        featured: p.featured,
        images: {
          create: p.images.map((img, i) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        },
        inventory: { create: { quantity: p.stock, lowStockThreshold: 5 } },
      },
    });
  }

  // Best Sellers / New Arrivals references
  const noir = await prisma.product.findUnique({ where: { slug: "ra-noir" } });
  const ambre = await prisma.product.findUnique({ where: { slug: "ra-ambre" } });
  const vert = await prisma.product.findUnique({ where: { slug: "ra-vert" } });
  if (noir && ambre && vert) {
    // Best sellers: NOIR + AMBRE (reflected via a coupon/collection note); New Arrivals: VERT
  }

  // ── Coupon ─────────────────────────────────────────────────
  await prisma.coupon.create({
    data: {
      code: "RA10",
      type: "PERCENTAGE",
      value: 10,
      minOrder: 3000,
      active: true,
    },
  });

  // ── Settings ───────────────────────────────────────────────
  const settings = [
    { key: "shipping", value: { flatRate: 199, freeThreshold: 2500, cityRates: {}, provinceRates: {} } },
    { key: "storeStatus", value: "open" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value as never },
      create: { key: s.key, value: s.value as never },
    });
  }

  // ── Demo order + verified reviews ─────────────────────────
  if (noir && ambre) {
    const orderNumber = `RA-DEMO-${Date.now().toString().slice(-6)}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        status: OrderStatus.DELIVERED,
        paymentMethod: "COD",
        paymentStatus: "PAID",
        subtotal: noir.price + ambre.price,
        discountTotal: 0,
        shipping: 0,
        total: noir.price + ambre.price,
        currency: "PKR",
        shippingName: customer.name,
        shippingPhone: customer.phone || "03001234567",
        shippingEmail: customer.email,
        shippingLine1: "House 12, Street 4, DHA Phase 6",
        shippingCity: "Karachi",
        shippingProvince: "Sindh",
        deliveredAt: new Date(),
        items: {
          create: [
            { productId: noir.id, productName: noir.name, sku: noir.sku, price: noir.price, quantity: 1, total: noir.price },
            { productId: ambre.id, productName: ambre.name, sku: ambre.sku, price: ambre.price, quantity: 1, total: ambre.price },
          ],
        },
      },
    });

    for (const item of [noir, ambre]) {
      const inv = await prisma.inventory.findUnique({ where: { productId: item.id } });
      const prev = inv?.quantity ?? 0;
      await prisma.inventory.update({
        where: { id: inv!.id },
        data: { quantity: prev - 1 },
      });
      await prisma.inventoryTransaction.create({
        data: {
          productId: item.id,
          type: "SALE",
          quantityDelta: -1,
          previousQuantity: prev,
          newQuantity: prev - 1,
          orderId: order.id,
          reason: "Order",
        },
      });
      await prisma.product.update({
        where: { id: item.id },
        data: { salesCount: { increment: 1 } },
      });
    }

    await prisma.review.create({
      data: {
        productId: noir.id,
        userId: customer.id,
        orderId: order.id,
        rating: 5,
        title: "Worth every rupee",
        body: "Noir is rich and long-lasting without being overpowering. The bottle feels far more premium than the price. My new signature.",
        status: "APPROVED",
      },
    });
    await prisma.review.create({
      data: {
        productId: ambre.id,
        userId: customer.id,
        orderId: order.id,
        rating: 4,
        title: "Warm and elegant",
        body: "Beautiful amber warmth for evenings. Slightly sweet but very refined.",
        status: "APPROVED",
      },
    });

    for (const p of [noir, ambre]) {
      const agg = await prisma.review.aggregate({
        where: { productId: p.id, status: "APPROVED" },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.product.update({
        where: { id: p.id },
        data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count.rating },
      });
    }
  }

  console.log("[seed] done");
  console.log(`[seed] admin login → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("[seed] customer login → ayesha@example.com / Customer@123");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[seed] failed", e);
    process.exit(1);
  });
