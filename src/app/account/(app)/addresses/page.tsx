"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiRequestError } from "@/lib/api-client";
import { PK_PROVINCES } from "@/lib/constants";

const schema = z.object({
  fullName: z.string().min(2, "Name is required."),
  phone: z.string().regex(/^(\+?92|0)?3\d{2}[-\s]?\d{7}$/, "Valid mobile required."),
  line1: z.string().min(4, "Address is required."),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required."),
  province: z.string().min(2, "Province is required."),
  postalCode: z.string().optional(),
});

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = React.useState<Address[] | null>(null);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const load = React.useCallback(() => {
    api<{ addresses: Address[] }>("/api/account/addresses").then((d) => setAddresses(d.addresses));
  }, []);

  React.useEffect(load, [load]);

  async function onSubmit(values: z.infer<typeof schema>) {
    setError("");
    try {
      await api("/api/account/addresses", { method: "POST", body: values });
      setOpen(false);
      reset();
      load();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Something went wrong.");
    }
  }

  async function remove(id: string) {
    await api(`/api/account/addresses/${id}`, { method: "DELETE" });
    load();
  }

  if (!addresses) return <p className="text-ink-secondary">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink">Saved Addresses</h2>
        <Button variant="accent" onClick={() => setOpen(true)}>Add Address</Button>
      </div>

      {addresses.length === 0 ? (
        <p className="border border-border bg-surface p-8 text-sm text-ink-secondary">
          No saved addresses yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">{a.fullName}</p>
                {a.isDefault && <Badge variant="accent">Default</Badge>}
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{a.line1}</p>
              {a.line2 && <p className="text-sm text-ink-secondary">{a.line2}</p>}
              <p className="text-sm text-ink-secondary">
                {a.city}, {a.province}
              </p>
              <p className="text-sm text-ink-secondary">{a.phone}</p>
              <button onClick={() => remove(a.id)} className="mt-3 text-xs uppercase tracking-wider text-ink-muted hover:text-danger">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Add Address">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <Input placeholder="Full name" {...register("fullName")} />
          <Input placeholder="Mobile number" {...register("phone")} />
          <Input placeholder="Address" {...register("line1")} />
          <Input placeholder="Address line 2 (optional)" {...register("line2")} />
          <Input placeholder="City" {...register("city")} />
          <select {...register("province")} defaultValue="" className="h-11 w-full border border-border bg-surface px-4 text-sm text-ink">
            <option value="" disabled>Province</option>
            {PK_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <Input placeholder="Postal code (optional)" {...register("postalCode")} />
          {errors.fullName && <p className="text-xs text-danger">{errors.fullName.message}</p>}
          <Button type="submit" variant="accent" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save Address"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
