import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[A-Za-z]/, "Password must contain at least one letter.")
  .regex(/\d/, "Password must contain at least one number.");

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email.").max(254);

/** Loose but sensible Pakistani mobile validation. */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?92|0)?3\d{2}[-\s]?\d{7}$/, "Enter a valid mobile number.");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(80),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(200),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20).max(200),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(4).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  province: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(25),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty.").max(50),
  couponCode: z.string().trim().max(50).optional().or(z.literal("")),
  address: addressSchema,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  // honeypot (spam trap) — must stay empty
  website: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(3000),
  website: z.string().max(0).optional(), // honeypot
});

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(25),
});

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1).max(50),
});

export const reviewCreateSchema = z.object({
  productId: z.string().min(1).max(64),
  // Public order number — never a database id.
  orderNumber: z.string().min(6).max(40),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(5).max(2000),
});

// ── Admin ─────────────────────────────────────────────────────

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(1).max(140),
  description: z.string().trim().min(5).max(5000),
  price: z.number().int().min(1).max(10_000_000),
  compareAtPrice: z.number().int().min(0).max(10_000_000).nullable().optional(),
  sku: z.string().trim().min(1).max(64),
  categoryId: z.string().max(64).nullable().optional(),
  family: z.string().trim().max(80).nullable().optional(),
  topNotes: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  heartNotes: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  baseNotes: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  size: z.string().trim().min(1).max(40),
  ingredients: z.array(z.string().trim().min(1).max(200)).max(40).default([]),
  occasions: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  timeOfDay: z.string().trim().max(40).nullable().optional(),
  personality: z.string().trim().max(300).nullable().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED", "OUT_OF_STOCK"]).default("DRAFT"),
  featured: z.boolean().default(false),
  images: z
    .array(z.object({ url: z.string().min(1).max(500), alt: z.string().max(200).optional() }))
    .max(10)
    .optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(1).max(140),
  description: z.string().trim().max(1000).nullable().optional(),
  imageUrl: z.string().max(500).nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

const couponBaseSchema = z.object({
  code: z.string().trim().min(3).max(50),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().int().min(1),
  minOrder: z.number().int().min(0).nullable().optional(),
  maxDiscount: z.number().int().min(0).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  perUserLimit: z.number().int().min(1).nullable().optional(),
  active: z.boolean().default(true),
  categoryIds: z.array(z.string()).max(50).default([]),
  productIds: z.array(z.string()).max(50).default([]),
});

export const couponCreateSchema = couponBaseSchema.refine(
  (c) => c.type !== "PERCENTAGE" || c.value <= 100,
  {
    message: "Percentage discount cannot exceed 100.",
    path: ["value"],
  },
);

export const couponUpdateSchema = couponBaseSchema.partial();

export const inventoryAdjustSchema = z.object({
  type: z.enum([
    "PURCHASE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "DAMAGE",
    "MANUAL_CORRECTION",
  ]),
  quantity: z.number().int().min(0).max(10_000_000),
  reason: z.string().trim().max(300).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const orderNoteSchema = z.object({
  note: z.string().trim().min(1).max(2000),
});

export const customerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  status: z.enum(["ACTIVE", "SUSPENDED", "ANONYMIZED"]).optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema,
});

export const settingsSchema = z.object({
  storeName: z.string().trim().min(1).max(80).optional(),
  tagline: z.string().trim().max(200).optional(),
  supportEmail: emailSchema.optional(),
  supportPhone: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  storeStatus: z.enum(["open", "maintenance"]).optional(),
  shipping: z
    .object({
      flatRate: z.number().int().min(0).max(100000),
      freeThreshold: z.number().int().min(0).max(10000000),
      cityRates: z.record(z.string(), z.number().int().min(0).max(100000)).optional(),
      provinceRates: z.record(z.string(), z.number().int().min(0).max(100000)).optional(),
    })
    .optional(),
  social: z
    .object({
      instagram: z.string().max(300).optional(),
      facebook: z.string().max(300).optional(),
      whatsapp: z.string().max(40).optional(),
    })
    .optional(),
});
