"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiRequestError } from "@/lib/api-client";

interface Row {
  id: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  product: { name: string; sku: string; slug: string; status: string; price: number };
}

interface Tx {
  id: string;
  type: string;
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  createdAt: string;
  product: { name: string };
}

const TYPES = ["ADJUSTMENT", "PURCHASE", "RETURN", "DAMAGE", "MANUAL_CORRECTION"];

export default function AdminInventoryPage() {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [transactions, setTransactions] = React.useState<Tx[] | null>(null);
  const [lowOnly, setLowOnly] = React.useState(false);
  const [adjusting, setAdjusting] = React.useState<Row | null>(null);
  const [quantity, setQuantity] = React.useState("0");
  const [type, setType] = React.useState("ADJUSTMENT");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    const params = new URLSearchParams({ pageSize: "100" });
    if (lowOnly) params.set("lowStockOnly", "1");
    api<{ items: Row[] }>(`/api/admin/inventory?${params}`).then((d) => setRows(d.items));
    api<{ items: Tx[] }>("/api/admin/inventory/transactions?pageSize=20").then((d) => setTransactions(d.items));
  }, [lowOnly]);

  React.useEffect(load, [load]);

  async function adjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjusting) return;
    setError("");
    try {
      await api(`/api/admin/inventory/${adjusting.productId}/adjust`, {
        method: "POST",
        body: { type, quantity: Number(quantity), note },
      });
      setAdjusting(null);
      setQuantity("0");
      setNote("");
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Adjustment failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Inventory</h1>
          <p className="mt-1 text-sm text-ink-secondary">Stock levels and transaction history.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-secondary">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="h-4 w-4 accent-[#C8A96B]" />
          Low stock only
        </label>
      </div>

      <div className="border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows?.map((r) => {
              const low = r.quantity <= r.lowStockThreshold;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/admin/products/${r.productId}`} className="font-medium text-ink hover:text-accent">
                      {r.product.name}
                    </Link>
                  </TableCell>
                  <TableCell>{r.product.sku}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell>{r.lowStockThreshold}</TableCell>
                  <TableCell>
                    {r.quantity <= 0 ? (
                      <Badge variant="danger">Out of Stock</Badge>
                    ) : low ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => { setAdjusting(r); setQuantity(String(r.quantity)); }} className="text-xs text-accent hover:underline">
                      Adjust Stock
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="font-display text-xl text-ink">Recent Transactions</h2>
        <div className="mt-3 divide-y divide-border border-y border-border">
          {transactions?.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <span className="text-ink">{t.product.name}</span>
                <span className="ml-2 text-xs text-ink-muted">{t.type}</span>
                {t.reason && <span className="ml-2 text-xs text-ink-muted">({t.reason})</span>}
              </div>
              <div className="text-ink-secondary">
                <span className={t.quantityDelta >= 0 ? "text-success" : "text-danger"}>
                  {t.quantityDelta >= 0 ? `+${t.quantityDelta}` : t.quantityDelta}
                </span>
                <span className="ml-3 text-xs text-ink-muted">
                  {t.previousQuantity} → {t.newQuantity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!adjusting} onClose={() => setAdjusting(null)} title={`Adjust Stock — ${adjusting?.product.name ?? ""}`}>
        <form onSubmit={adjust} className="space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <div>
            <label className="text-xs uppercase tracking-widest2 text-ink-muted">New Quantity</label>
            <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-2" required />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-ink-muted">Reason Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-2 h-11 w-full border border-border bg-surface px-4 text-sm text-ink">
              {TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest2 text-ink-muted">Note (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-2" />
          </div>
          <Button type="submit" variant="accent">Apply Adjustment</Button>
        </form>
      </Dialog>
    </div>
  );
}
