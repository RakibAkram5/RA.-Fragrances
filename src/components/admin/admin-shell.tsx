"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldAlert,
  Star,
  Tags,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/inventory", label: "Inventory", icon: ClipboardList },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: ScrollText },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldAlert },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="mx-auto flex max-w-8xl">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
        <div className="border-b border-border px-6 py-5">
          <Link href="/admin/dashboard" className="font-display text-xl tracking-[0.3em] text-ink">
            RA
          </Link>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest2 text-ink-muted">Admin</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-3" aria-label="Admin">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-surface-2 hover:text-ink",
                pathname.startsWith(l.href) && "bg-surface-2 text-ink",
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
          <div className="my-2 border-t border-border" />
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ExternalLink className="h-4 w-4" /> View Store
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 text-left text-sm text-ink-secondary transition-colors hover:bg-surface-2 hover:text-danger"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        {/* Mobile nav */}
        <div className="mb-6 flex gap-1 overflow-x-auto md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "shrink-0 border px-3 py-1.5 text-xs text-ink-secondary",
                pathname.startsWith(l.href) ? "border-accent text-ink" : "border-border",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
