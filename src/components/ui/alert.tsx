import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "error" | "success" | "warning";

const styles: Record<Variant, string> = {
  default: "border-border bg-surface text-ink-secondary",
  error: "border-danger/40 bg-danger/10 text-danger",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
};

export function Alert({
  variant = "default",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div
      role="alert"
      className={cn("border px-4 py-3 text-sm", styles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
