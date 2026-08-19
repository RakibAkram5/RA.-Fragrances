"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { api, apiForm, ApiRequestError } from "@/lib/api-client";
import { FRAGRANCE_FAMILIES, OCCASIONS } from "@/lib/constants";

interface Category {
  id: string;
  name: string;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: string;
  sku: string;
  categoryId: string;
  family: string;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  size: string;
  ingredients: string;
  occasions: string;
  timeOfDay: string;
  personality: string;
  status: string;
  featured: boolean;
  initialStock: string;
  images: { url: string; alt: string }[];
}

function split(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function ProductForm({
  mode,
  productId,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial?: Partial<ProductFormValues>;
  categories: Category[];
}) {
  const router = useRouter();
  const [error, setError] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [images, setImages] = React.useState<{ url: string; alt: string }[]>(
    initial?.images ?? [],
  );
  const [featured, setFeatured] = React.useState(initial?.featured ?? false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProductFormValues>({
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? 1890,
      compareAtPrice: initial?.compareAtPrice ?? "",
      sku: initial?.sku ?? "",
      categoryId: initial?.categoryId ?? "",
      family: initial?.family ?? "",
      topNotes: initial?.topNotes ?? "",
      heartNotes: initial?.heartNotes ?? "",
      baseNotes: initial?.baseNotes ?? "",
      size: initial?.size ?? "50ml",
      ingredients: initial?.ingredients ?? "",
      occasions: initial?.occasions ?? "",
      timeOfDay: initial?.timeOfDay ?? "",
      personality: initial?.personality ?? "",
      status: initial?.status ?? "DRAFT",
      initialStock: initial?.initialStock ?? "0",
    },
  });

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const data = await apiForm<{ url: string }>("/api/admin/upload", fd);
      setImages((prev) => [...prev, { url: data.url, alt: "" }]);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSubmit(values: ProductFormValues) {
    setError("");
    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      price: Number(values.price),
      compareAtPrice: values.compareAtPrice ? Number(values.compareAtPrice) : null,
      sku: values.sku,
      categoryId: values.categoryId || null,
      family: values.family || null,
      topNotes: split(values.topNotes),
      heartNotes: split(values.heartNotes),
      baseNotes: split(values.baseNotes),
      size: values.size,
      ingredients: split(values.ingredients),
      occasions: split(values.occasions),
      timeOfDay: values.timeOfDay || null,
      personality: values.personality || null,
      status: values.status,
      featured,
      images,
      ...(mode === "create" ? { initialStock: Number(values.initialStock) || 0 } : {}),
    };

    try {
      if (mode === "create") {
        await api("/api/admin/products", { method: "POST", body: payload });
      } else {
        await api(`/api/admin/products/${productId}`, { method: "PATCH", body: payload });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Name</label>
          <Input {...register("name")} className="mt-2" required />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Slug</label>
          <Input {...register("slug")} className="mt-2" placeholder="ra-noir" required />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Description</label>
          <Textarea {...register("description")} className="mt-2" rows={4} required />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Price (PKR)</label>
          <Input type="number" {...register("price", { valueAsNumber: true })} className="mt-2" required />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Compare-at Price (optional)</label>
          <Input type="number" {...register("compareAtPrice")} className="mt-2" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">SKU</label>
          <Input {...register("sku")} className="mt-2" required />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Category</label>
          <select {...register("categoryId")} className="mt-2 h-11 w-full border border-border bg-surface px-4 text-sm text-ink">
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Family</label>
          <Input {...register("family")} list="families" className="mt-2" />
          <datalist id="families">
            {FRAGRANCE_FAMILIES.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Size</label>
          <Input {...register("size")} className="mt-2" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Top Notes (comma-separated)</label>
          <Input {...register("topNotes")} className="mt-2" placeholder="Bergamot, Pink Pepper" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Heart Notes</label>
          <Input {...register("heartNotes")} className="mt-2" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Base Notes</label>
          <Input {...register("baseNotes")} className="mt-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Ingredients (comma-separated)</label>
          <Input {...register("ingredients")} className="mt-2" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Occasions (comma-separated)</label>
          <Input {...register("occasions")} list="occasions" className="mt-2" placeholder="Evening, Formal" />
          <datalist id="occasions">
            {OCCASIONS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Time of Day</label>
          <Input {...register("timeOfDay")} className="mt-2" placeholder="Day / Night / Any" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Personality</label>
          <Textarea {...register("personality")} className="mt-2" rows={2} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest2 text-ink-muted">Status</label>
          <select {...register("status")} className="mt-2 h-11 w-full border border-border bg-surface px-4 text-sm text-ink">
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
        {mode === "create" && (
          <div>
            <label className="text-xs uppercase tracking-widest2 text-ink-muted">Initial Stock</label>
            <Input type="number" {...register("initialStock")} className="mt-2" />
          </div>
        )}
        <div className="flex items-end gap-3 pb-2">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-ink-muted">Featured</p>
            <div className="mt-2">
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest2 text-ink-muted">Images</label>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden border border-border bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 bg-black/60 p-1 text-white"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-border-strong text-ink-muted hover:text-ink">
            <Upload className="h-5 w-5" />
            <span className="text-[10px] uppercase tracking-wider">{uploading ? "Uploading…" : "Upload"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={upload} />
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={isSubmitting || uploading}>
          {isSubmitting ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
