import "server-only";

import { getSettings, type ShippingSettings } from "@/lib/settings";

/**
 * Shipping is always calculated server-side from configured rules:
 *  1. Free shipping once the subtotal reaches the configured threshold.
 *  2. City-specific rate (if configured for the delivery city).
 *  3. Province-specific rate (if configured for the province).
 *  4. Flat rate fallback.
 */
export function computeShipping(
  subtotal: number,
  address: { city: string; province: string },
  shipping: ShippingSettings,
): number {
  if (subtotal >= shipping.freeThreshold) return 0;

  const cityKey = address.city.trim().toLowerCase();
  if (cityKey && shipping.cityRates[cityKey] !== undefined) {
    return shipping.cityRates[cityKey] ?? shipping.flatRate;
  }

  const provinceKey = address.province.trim().toLowerCase();
  if (provinceKey && shipping.provinceRates[provinceKey] !== undefined) {
    return shipping.provinceRates[provinceKey] ?? shipping.flatRate;
  }

  return shipping.flatRate;
}

export async function computeShippingForAddress(
  subtotal: number,
  address: { city: string; province: string },
): Promise<number> {
  const settings = await getSettings();
  return computeShipping(subtotal, address, settings.shipping);
}
