"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api, ApiRequestError } from "@/lib/api-client";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  active: boolean;
  _count: { usages: number };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<Coupon[] | null>(null);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState("");
  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState("PERCENTAGE");
  const [value, setValue] = React.useState("10");
  const [minOrder, setMinOrder] = React.useState("");
  const [active, setActive] = React.useState(true);

  const load = React.useCallback(() => {
    api<{ coupons: Coupon[] }>("/api/admin/coupons").then((d) => setCoupons(d.coupons));
  }, []);

  React.useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/admin/coupons", {
        method: "POST",
        body: {
          code,
          type,
          value: Number(value),
          minOrder: minOrder ? Number(minOrder) : null,
          active,
          categoryIds: [],
          productIds: [],
        },
      });
      setOpen(false);
      setCode("");
      setValue("10");
      setMinOrder("");
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create.");
    }
  }

  async function toggle(c: Coupon) {
    await api(`/api/admin/coupons/${c.id}`, { method: "PATCH", body: { active: !c.active } });
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this coupon?")) return;
    await api(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Coupons</h1>
          <p className="mt-1 text-sm text-ink-secondary">Discount codes for customers.</p>
        </div>
        <Button variant="accent" onClick={() => setOpen(true)}>New Coupon</Button>
      </div>

      <div className="divide-y divide-border border-y border-border">
        {coupons?.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-ink">{c.code}</span>
                {c.active ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                {c.type === "PERCENTAGE" ? `${c.value}% off` : `PKR ${c.value} off`}
                {c.minOrder ? ` · min order PKR ${c.minOrder}` : ""} · {c._count.usages} uses
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Switch checked={c.active} onCheckedChange={() => toggle(c)} />
              <button onClick={() => remove(c.id)} className="text-xs text-danger hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="New Coupon">
        <form onSubmit={create} className="space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code (e.g. RA10)" required />
          <div className="grid grid-cols-2 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-11 border border-border bg-surface px-3 text-sm text-ink">
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed (PKR)</option>
            </select>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" required />
          </div>
          <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Minimum order (optional)" />
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm text-ink-secondary">Active</span>
          </div>
          <Button type="submit" variant="accent">Create Coupon</Button>
        </form>
      </Dialog>
    </div>
  );
}
