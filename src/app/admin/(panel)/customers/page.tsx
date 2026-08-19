"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  _count: { orders: number };
}

export default function AdminCustomersPage() {
  const [data, setData] = React.useState<{ items: Customer[]; total: number } | null>(null);
  const [q, setQ] = React.useState("");
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "100" });
    if (q) params.set("q", q);
    api<{ items: Customer[]; total: number }>(`/api/admin/customers?${params}`).then(setData);
  }, [q]);

  React.useEffect(load, [load]);

  async function anonymize(id: string) {
    if (!window.confirm("Deactivate and anonymise this customer? Order records are preserved.")) return;
    setMsg("");
    try {
      await api(`/api/admin/customers/${id}/anonymize`, { method: "POST" });
      setMsg("Customer deactivated and anonymised.");
      load();
    } catch (e) {
      setMsg(e instanceof ApiRequestError ? e.message : "Failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Customers</h1>
        <p className="mt-1 text-sm text-ink-secondary">{data?.total ?? 0} accounts</p>
      </div>

      {msg && <p className="border border-success/40 bg-success/10 p-3 text-sm text-success">{msg}</p>}

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / email / phone" className="w-72" />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="divide-y divide-border border-y border-border">
        {data?.items.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{c.name}</span>
                {c.role === "ADMIN" && <Badge variant="accent">Admin</Badge>}
                {c.status === "SUSPENDED" && <Badge variant="warning">Suspended</Badge>}
                {c.status === "ANONYMIZED" && <Badge variant="danger">Anonymised</Badge>}
              </div>
              <p className="text-xs text-ink-muted">{c.email}{c.phone ? ` · ${c.phone}` : ""} · joined {formatDate(c.createdAt)} · {c._count.orders} orders</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/customers/${c.id}`} className="text-xs text-accent hover:underline">View</Link>
              {c.status !== "ANONYMIZED" && (
                <button onClick={() => anonymize(c.id)} className="text-xs text-danger hover:underline">Anonymise</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
