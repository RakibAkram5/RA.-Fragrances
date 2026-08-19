"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { api, ApiRequestError } from "@/lib/api-client";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  sortOrder: number;
  _count: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    api<{ categories: Category[] }>("/api/admin/categories").then((d) => setCategories(d.categories));
  }, []);

  React.useEffect(load, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/admin/categories", { method: "POST", body: { name, slug, sortOrder: 0 } });
      setOpen(false);
      setName("");
      setSlug("");
      load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create.");
    }
  }

  async function archive(id: string) {
    await api(`/api/admin/categories/${id}?mode=archive`, { method: "DELETE" });
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this category? Products will become uncategorised.")) return;
    await api(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Categories</h1>
          <p className="mt-1 text-sm text-ink-secondary">Organise the collection.</p>
        </div>
        <Button variant="accent" onClick={() => setOpen(true)}>Add Category</Button>
      </div>

      <div className="divide-y divide-border border-y border-border">
        {categories?.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-ink">{c.name}</span>
                {c.status === "ARCHIVED" ? (
                  <Badge variant="warning">Archived</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <p className="text-xs text-ink-muted">/{c.slug} · {c._count.products} products</p>
            </div>
            <div className="flex gap-3 text-xs">
              {c.status === "ACTIVE" ? (
                <button onClick={() => archive(c.id)} className="text-warning hover:underline">Archive</button>
              ) : (
                <button onClick={() => archive(c.id)} className="text-success hover:underline">Unarchive</button>
              )}
              <button onClick={() => remove(c.id)} className="text-danger hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Add Category">
        <form onSubmit={create} className="space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Eau de Parfum)" required />
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (e.g. eau-de-parfum)" required />
          <Button type="submit" variant="accent">Create Category</Button>
        </form>
      </Dialog>
    </div>
  );
}
