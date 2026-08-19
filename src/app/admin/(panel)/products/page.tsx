"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiRequestError } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  status: string;
  featured: boolean;
  stock: number;
  salesCount: number;
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  DRAFT: "default",
  ARCHIVED: "warning",
  OUT_OF_STOCK: "danger",
};

export default function AdminProductsPage() {
  const [data, setData] = React.useState<{ items: ProductRow[]; total: number; pageCount: number } | null>(null);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    api<{ items: ProductRow[]; total: number; pageCount: number }>(`/api/admin/products?${params}`)
      .then(setData)
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Failed to load."));
  }, [q, status, page]);

  React.useEffect(load, [load]);

  async function act(id: string, action: "archive" | "restore" | "delete") {
    if (action === "delete" && !window.confirm("Permanently delete this product? This is only possible when there are no orders.")) return;
    try {
      if (action === "archive") {
        await api(`/api/admin/products/${id}`, { method: "PATCH", body: { status: "ARCHIVED" } });
      } else if (action === "restore") {
        await api(`/api/admin/products/${id}/restore`, { method: "POST" });
      } else {
        await api(`/api/admin/products/${id}`, { method: "DELETE" });
      }
      load();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Action failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Products</h1>
          <p className="mt-1 text-sm text-ink-secondary">{data?.total ?? 0} products</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex h-10 items-center gap-2 bg-accent px-4 text-sm text-background hover:bg-accent-strong">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {error && <p className="border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }}
          className="flex gap-2"
        >
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / SKU" className="w-56" />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-11 border border-border bg-surface px-3 text-sm text-ink"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      <div className="border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-accent">
                    {p.name}
                  </Link>
                  {p.featured && <Badge variant="accent" className="ml-2">Featured</Badge>}
                </TableCell>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{formatPKR(p.price)}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>{p.salesCount}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[p.status] ?? "default"}>{p.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2 text-xs">
                    <Link href={`/admin/products/${p.id}`} className="text-accent hover:underline">Edit</Link>
                    {p.status === "ARCHIVED" ? (
                      <button onClick={() => act(p.id, "restore")} className="text-success hover:underline">Restore</button>
                    ) : (
                      <button onClick={() => act(p.id, "archive")} className="text-warning hover:underline">Archive</button>
                    )}
                    <button onClick={() => act(p.id, "delete")} className="text-danger hover:underline">Delete</button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.pageCount > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: data.pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={n === page ? "h-9 w-9 bg-accent text-sm text-background" : "h-9 w-9 border border-border text-sm text-ink-secondary"}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
