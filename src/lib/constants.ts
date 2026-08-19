export const SITE_NAME = "RA";
export const SITE_TAGLINE = "Own Your Presence.";

export const DEFAULT_PRIMARY_PRICE = 1890; // PKR — maximum selling price

/** Administrative divisions of Pakistan (for checkout + shipping). */
export const PK_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

export const PK_MAJOR_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
] as const;

/** Fragrance families used by the quiz + product data. */
export const FRAGRANCE_FAMILIES = [
  "Woody",
  "Oriental",
  "Fresh",
  "Floral",
  "Citrus",
  "Spicy",
  "Aromatic",
] as const;

/** Occasions used by the quiz + product data. */
export const OCCASIONS = [
  "Everyday",
  "Office",
  "Evening",
  "Date Night",
  "Formal",
  "Casual",
  "Special Occasion",
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

/** Default settings — overridable by admins in the Settings page. */
export const DEFAULT_SETTINGS = {
  storeName: "RA",
  tagline: SITE_TAGLINE,
  supportEmail: "care@ra-fragrances.pk",
  supportPhone: "+92 300 0000000",
  whatsapp: "923000000000",
  instagram: "https://instagram.com/ra.fragrances",
  facebook: "",
  address: "Pakistan",
  currency: "PKR",
  storeStatus: "open",
  shipping: {
    flatRate: 199,
    freeThreshold: 2500,
    cityRates: {} as Record<string, number>,
    provinceRates: {} as Record<string, number>,
  },
  social: {
    instagram: "https://instagram.com/ra.fragrances",
    facebook: "",
    whatsapp: "923000000000",
  },
} as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];
