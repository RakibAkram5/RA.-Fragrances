"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { api } from "@/lib/api-client";

const NAV = [
  { label: "Shop", href: "/shop" },
  { label: "Discover", href: "/quiz" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const router = useRouter();
  const { cart, setDrawerOpen } = useCart();
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    api<{ user: { id: string } | null }>("/api/auth/me")
      .then((d) => setLoggedIn(Boolean(d.user)))
      .catch(() => setLoggedIn(false));
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/shop${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <button
            className="text-ink md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="font-display text-2xl tracking-[0.35em] text-ink">
            RA
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm uppercase tracking-wider text-ink-secondary transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <form onSubmit={submitSearch} className="hidden lg:block" role="search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search products"
                className="h-9 w-44 border border-border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:w-56 focus:border-accent focus:outline-none transition-all"
              />
            </div>
          </form>
          <Link
            href="/shop"
            className="flex h-10 w-10 items-center justify-center text-ink-secondary transition-colors hover:text-ink lg:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href={loggedIn ? "/account/dashboard" : "/account/login"}
            className="flex h-10 w-10 items-center justify-center text-ink-secondary transition-colors hover:text-ink"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center text-ink-secondary transition-colors hover:text-ink"
            aria-label={`Open cart (${cart?.itemCount ?? 0} items)`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cart && cart.itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-background">
                {cart.itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-background px-4 py-4 md:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-sm uppercase tracking-wider text-ink-secondary hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <form onSubmit={submitSearch}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="h-10 w-full border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
                />
              </form>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
