"use client";

import * as React from "react";
import { X } from "lucide-react";

export function ProductGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const [active, setActive] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);

  const list = images.length > 0 ? images : [{ url: "/brand/product-placeholder.png", alt: name }];
  const current = list[active] ?? list[0]!;

  return (
    <div>
      <div
        className="group relative aspect-square cursor-zoom-in overflow-hidden bg-surface-2"
        onClick={() => setZoom(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt ?? name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden border bg-surface-2 ${
                i === active ? "border-accent" : "border-border hover:border-border-strong"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? name} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Zoomed view of ${name}`}
        >
          <button
            className="absolute right-4 top-4 text-ink-muted hover:text-ink"
            aria-label="Close zoom"
            onClick={() => setZoom(false)}
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.alt ?? name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
