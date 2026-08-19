"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Banknote, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useCart } from "@/components/store/cart-provider";
import { api, ApiRequestError } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";
import { PK_PROVINCES, PK_MAJOR_CITIES } from "@/lib/constants";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  phone: z.string().regex(/^(\+?92|0)?3\d{2}[-\s]?\d{7}$/, "Enter a valid mobile number."),
  email: z.string().email("Enter a valid email."),
  line1: z.string().min(4, "Address is required."),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required."),
  province: z.string().min(2, "Province is required."),
  postalCode: z.string().optional(),
  notes: z.string().max(1000).optional(),
  couponCode: z.string().max(50).optional(),
  website: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading } = useCart();
  const [coupon, setCoupon] = React.useState<{ code: string; discount: number } | null>(null);
  const [couponStatus, setCouponStatus] = React.useState<"idle" | "error" | "ok">("idle");
  const [couponMsg, setCouponMsg] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const subtotal = cart?.subtotal ?? 0;
  const discount = coupon?.discount ?? 0;

  async function applyCoupon() {
    const code = (document.getElementById("couponCode") as HTMLInputElement)?.value;
    if (!code?.trim()) return;
    setCouponStatus("idle");
    try {
      const data = await api<{ valid: boolean; code: string; discount: number }>(
        "/api/coupons/validate",
        { method: "POST", body: { code: code.trim() } },
      );
      setCoupon({ code: data.code, discount: data.discount });
      setValue("couponCode", code.trim());
      setCouponStatus("ok");
      setCouponMsg(`Coupon applied: −${formatPKR(data.discount)}`);
    } catch (e) {
      setCoupon(null);
      setCouponStatus("error");
      setCouponMsg(e instanceof ApiRequestError ? e.message : "Invalid coupon.");
    }
  }

  async function onSubmit(values: FormValues) {
    if (!cart || cart.items.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await api<{ order: { orderNumber: string } }>("/api/checkout", {
        method: "POST",
        body: {
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: coupon?.code ?? "",
          address: {
            fullName: values.fullName,
            phone: values.phone,
            line1: values.line1,
            line2: values.line2 || "",
            city: values.city,
            province: values.province,
            postalCode: values.postalCode || "",
          },
          notes: values.notes || "",
        },
      });
      router.push(`/account/orders/${data.order.orderNumber}?placed=1`);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-ink-secondary">Loading…</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl text-ink">Your cart is empty</h1>
        <p className="mt-4 text-ink-secondary">Add a fragrance before checking out.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="mb-8">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-3 font-display text-4xl text-ink">Complete Your Order</h1>
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-2xl text-ink">Delivery Details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" error={errors.fullName?.message}>
                <Input {...register("fullName")} aria-invalid={!!errors.fullName} />
              </Field>
              <Field label="Mobile Number" error={errors.phone?.message}>
                <Input {...register("phone")} inputMode="tel" placeholder="03xx xxxxxxx" aria-invalid={!!errors.phone} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email" error={errors.email?.message}>
                  <Input type="email" {...register("email")} aria-invalid={!!errors.email} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address" error={errors.line1?.message}>
                  <Input {...register("line1")} placeholder="House, street, area" aria-invalid={!!errors.line1} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address line 2 (optional)">
                  <Input {...register("line2")} />
                </Field>
              </div>
              <Field label="City" error={errors.city?.message}>
                <Input {...register("city")} list="cities" aria-invalid={!!errors.city} />
                <datalist id="cities">
                  {PK_MAJOR_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Province" error={errors.province?.message}>
                <select
                  {...register("province")}
                  defaultValue=""
                  className="h-11 w-full border border-border bg-surface px-4 text-sm text-ink focus:border-accent focus:outline-none"
                  aria-invalid={!!errors.province}
                >
                  <option value="" disabled>
                    Select province
                  </option>
                  {PK_PROVINCES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Postal Code (optional)">
                <Input {...register("postalCode")} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Order Notes (optional)">
                  <Textarea {...register("notes")} rows={3} />
                </Field>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink">Payment</h2>
            <div className="mt-4 flex items-center gap-3 border border-border bg-surface p-4">
              <Banknote className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-ink">Cash on Delivery</p>
                <p className="text-xs text-ink-muted">Pay in cash when your order arrives.</p>
              </div>
              <BadgeCheck className="ml-auto h-5 w-5 text-success" />
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-5 border border-border bg-surface p-6">
          <h2 className="font-display text-2xl text-ink">Order Summary</h2>
          <ul className="divide-y divide-border">
            {cart.items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-2 py-2.5 text-sm">
                <span className="text-ink-secondary">
                  {i.name} × {i.quantity}
                </span>
                <span className="text-ink">{formatPKR(i.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div>
            <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="couponCode">
              Coupon Code
            </label>
            <div className="mt-2 flex gap-2">
              <Input id="couponCode" placeholder="RA10" />
              <Button type="button" variant="outline" onClick={applyCoupon} className="shrink-0">
                Apply
              </Button>
            </div>
            {couponStatus !== "idle" && (
              <p className={`mt-1 text-xs ${couponStatus === "ok" ? "text-success" : "text-danger"}`}>
                {couponMsg}
              </p>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-ink-secondary">
              <span>Subtotal</span>
              <span>{formatPKR(subtotal)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-success">
                <span>Discount ({coupon.code})</span>
                <span>−{formatPKR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-secondary">
              <span>Shipping</span>
              <span>Calculated at confirmation</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-ink">
              <span className="font-medium">Total</span>
              <span className="font-display text-xl">{formatPKR(Math.max(0, subtotal - discount))}</span>
            </div>
          </div>

          {/* Honeypot */}
          <input type="text" {...register("website")} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

          <Button type="submit" variant="accent" className="w-full" disabled={submitting}>
            {submitting ? "Placing Order…" : "Place Order — Cash on Delivery"}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-muted">
            <Lock className="h-3 w-3" /> Secure Checkout · Prices verified server-side
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest2 text-ink-muted">{label}</label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
