import "server-only";

import { ApiError } from "@/lib/route-helpers";

/**
 * Payment architecture. Cash on Delivery is fully implemented. Online payment
 * gateways (JazzCash, EasyPaisa, Stripe…) plug in behind this interface and
 * remain isolated stubs until real credentials are supplied — they never
 * pretend to process payments without being configured.
 */
export interface PaymentProvider {
  readonly id: string;
  readonly label: string;
  /** Whether this method can currently be used at checkout. */
  isAvailable(): boolean;
  /** Create a payment intent/payload for an order. */
  createPayment(order: {
    orderNumber: string;
    total: number;
    currency: string;
  }): Promise<{ external: boolean; reference?: string }>;
}

class CashOnDeliveryProvider implements PaymentProvider {
  readonly id = "COD";
  readonly label = "Cash on Delivery";
  isAvailable() {
    return true;
  }
  async createPayment() {
    return { external: false };
  }
}

export function getPaymentProviders(): PaymentProvider[] {
  return [new CashOnDeliveryProvider()];
}

export function getPaymentProvider(id: string): PaymentProvider {
  const provider = getPaymentProviders().find((p) => p.id === id);
  if (!provider) throw new ApiError(400, "Unsupported payment method.");
  return provider;
}
