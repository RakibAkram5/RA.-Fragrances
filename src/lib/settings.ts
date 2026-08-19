import "server-only";

import { prisma } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/constants";

export interface ShippingSettings {
  flatRate: number;
  freeThreshold: number;
  cityRates: Record<string, number>;
  provinceRates: Record<string, number>;
}

export interface AppSettings {
  storeName: string;
  tagline: string;
  address: string;
  currency: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  storeStatus: "open" | "maintenance";
  shipping: ShippingSettings;
}

function mergeSettings(rows: { key: string; value: unknown }[]): AppSettings {
  const raw: Record<string, unknown> = {};
  for (const row of rows) raw[row.key] = row.value;

  const shipping = {
    ...DEFAULT_SETTINGS.shipping,
    ...((raw.shipping as Partial<ShippingSettings>) || {}),
  };

  return {
    storeName: (raw.storeName as string) || DEFAULT_SETTINGS.storeName,
    tagline: (raw.tagline as string) || DEFAULT_SETTINGS.tagline,
    address: (raw.address as string) || DEFAULT_SETTINGS.address,
    currency: (raw.currency as string) || DEFAULT_SETTINGS.currency,
    supportEmail: (raw.supportEmail as string) || DEFAULT_SETTINGS.supportEmail,
    supportPhone: (raw.supportPhone as string) || DEFAULT_SETTINGS.supportPhone,
    whatsapp: (raw.whatsapp as string) || DEFAULT_SETTINGS.whatsapp,
    instagram: (raw.instagram as string) || DEFAULT_SETTINGS.instagram,
    facebook: (raw.facebook as string) || DEFAULT_SETTINGS.facebook,
    storeStatus:
      (raw.storeStatus as "open" | "maintenance") || DEFAULT_SETTINGS.storeStatus,
    shipping,
  };
}

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany();
  return mergeSettings(
    rows.map((r) => ({ key: r.key, value: r.value as unknown })),
  );
}

export async function isStoreOpen(): Promise<boolean> {
  const settings = await getSettings();
  return settings.storeStatus === "open";
}

/** Upsert a single setting key. */
export async function setSetting(key: string, value: unknown): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
}
