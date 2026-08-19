/**
 * Currency utilities. The store's primary currency is PKR and money is stored
 * as whole rupees (integers) to avoid floating-point drift.
 */
export const CURRENCY = "PKR";

export function formatPKR(amount: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `PKR ${formatted}`;
}

export function formatMoney(amount: number, currency = CURRENCY): string {
  if (currency === "PKR") return formatPKR(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
