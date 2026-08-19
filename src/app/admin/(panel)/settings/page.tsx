"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";

interface Settings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  storeStatus: string;
  shipping: { flatRate: number; freeThreshold: number };
}

export default function AdminSettingsPage() {
  const [s, setS] = React.useState<Settings | null>(null);
  const [msg, setMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    api<{ settings: Settings }>("/api/admin/settings").then((d) => setS(d.settings));
  }, []);

  async function save() {
    if (!s) return;
    setMsg(null);
    try {
      await api("/api/admin/settings", {
        method: "PATCH",
        body: {
          storeName: s.storeName,
          tagline: s.tagline,
          supportEmail: s.supportEmail,
          supportPhone: s.supportPhone,
          whatsapp: s.whatsapp,
          instagram: s.instagram,
          address: s.address,
          storeStatus: s.storeStatus,
          shipping: { flatRate: Number(s.shipping.flatRate), freeThreshold: Number(s.shipping.freeThreshold) },
        },
      });
      setMsg({ type: "success", text: "Settings saved." });
    } catch (e) {
      setMsg({ type: "error", text: e instanceof ApiRequestError ? e.message : "Failed to save." });
    }
  }

  if (!s) return <p className="text-ink-secondary">Loading…</p>;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Store Settings</h1>
        <p className="mt-1 text-sm text-ink-secondary">Configure the storefront and delivery rules.</p>
      </div>

      {msg && <Alert variant={msg.type === "success" ? "success" : "error"}>{msg.text}</Alert>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Store Name"><Input value={s.storeName} onChange={(e) => set("storeName", e.target.value)} /></Field>
        <Field label="Tagline"><Input value={s.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
        <Field label="Support Email"><Input value={s.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} /></Field>
        <Field label="Support Phone"><Input value={s.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} /></Field>
        <Field label="WhatsApp (digits only)"><Input value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
        <Field label="Instagram URL"><Input value={s.instagram} onChange={(e) => set("instagram", e.target.value)} /></Field>
        <Field label="Address"><Input value={s.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="Flat Shipping (PKR)">
          <Input type="number" value={String(s.shipping.flatRate)} onChange={(e) => set("shipping", { ...s.shipping, flatRate: Number(e.target.value) })} />
        </Field>
        <Field label="Free Shipping Threshold (PKR)">
          <Input type="number" value={String(s.shipping.freeThreshold)} onChange={(e) => set("shipping", { ...s.shipping, freeThreshold: Number(e.target.value) })} />
        </Field>
        <div className="flex items-end gap-3 pb-2">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-ink-muted">Store Status</p>
            <div className="mt-2">
              <Switch
                checked={s.storeStatus === "open"}
                onCheckedChange={(open) => set("storeStatus", open ? "open" : "maintenance")}
              />
            </div>
          </div>
          <p className="text-sm text-ink-secondary">
            {s.storeStatus === "open" ? "Open" : "Maintenance mode"}
          </p>
        </div>
      </div>

      <Button variant="accent" onClick={save}>Save Settings</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest2 text-ink-muted">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
