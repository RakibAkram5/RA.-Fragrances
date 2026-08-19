"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: number;
  reviewCount: number;
  addresses: { id: string; line1: string; city: string; province: string }[];
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [c, setC] = React.useState<Customer | null>(null);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [msg, setMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    api<{ customer: Customer }>(`/api/admin/customers/${params.id}`).then((d) => {
      setC(d.customer);
      setName(d.customer.name);
      setPhone(d.customer.phone ?? "");
      setStatus(d.customer.status);
    });
  }, [params.id]);

  async function save() {
    setMsg(null);
    try {
      await api(`/api/admin/customers/${params.id}`, { method: "PATCH", body: { name, phone, status } });
      setMsg({ type: "success", text: "Customer updated." });
    } catch (e) {
      setMsg({ type: "error", text: e instanceof ApiRequestError ? e.message : "Failed." });
    }
  }

  if (!c) return <p className="text-ink-secondary">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">{c.name}</h1>
        <p className="mt-1 text-sm text-ink-secondary">{c.email}</p>
      </div>

      {msg && <Alert variant={msg.type === "success" ? "success" : "error"}>{msg.text}</Alert>}

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Orders" value={String(c.orderCount)} />
        <Stat label="Reviews" value={String(c.reviewCount)} />
        <Stat label="Joined" value={formatDate(c.createdAt)} />
      </div>

      <div className="space-y-4 border border-border bg-surface p-6">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 h-11 w-full border border-border bg-surface px-4 text-sm text-ink">
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ANONYMIZED">Anonymised</option>
          </select>
        </div>
        <Button variant="accent" onClick={save}>Save Changes</Button>
      </div>

      <div className="border border-border bg-surface p-6">
        <h2 className="font-display text-xl text-ink">Addresses</h2>
        {c.addresses.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">None</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
            {c.addresses.map((a) => (
              <li key={a.id}>{a.line1}, {a.city}, {a.province}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-widest2 text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl text-ink">{value}</p>
    </div>
  );
}
