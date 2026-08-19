"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, MapPin, Package, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";

const LINKS = [
  { href: "/account/dashboard", label: "Profile", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/reviews", label: "Reviews", icon: Star },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <p className="eyebrow">My Account</p>
        <h1 className="mt-3 font-display text-4xl text-ink">
          Welcome, {name.split(" ")[0]}
        </h1>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Account">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm text-ink-secondary transition-colors hover:bg-surface hover:text-ink",
                pathname === l.href && "bg-surface text-ink",
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-secondary transition-colors hover:bg-surface hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
