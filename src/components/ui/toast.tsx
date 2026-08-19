"use client";

import * as React from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex animate-fade-up items-start gap-3 border bg-surface px-4 py-3 text-sm",
              t.variant === "success" && "border-success/40",
              t.variant === "error" && "border-danger/40",
              t.variant === "default" && "border-border",
            )}
          >
            <span className="mt-0.5">
              {t.variant === "success" && <CheckCircle2 className="h-4 w-4 text-success" />}
              {t.variant === "error" && <XCircle className="h-4 w-4 text-danger" />}
              {t.variant === "default" && <Info className="h-4 w-4 text-accent" />}
            </span>
            <div className="flex-1">
              <p className="font-medium text-ink">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-ink-secondary">{t.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
