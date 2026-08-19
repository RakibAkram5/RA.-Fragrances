"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
  max = 25,
  min = 1,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center border border-border bg-surface",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-10 w-10 items-center justify-center text-ink-secondary transition-colors hover:text-ink disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm tabular-nums text-ink">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-10 w-10 items-center justify-center text-ink-secondary transition-colors hover:text-ink disabled:opacity-40"
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
