"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";

interface PublicSettings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  whatsapp: string;
  instagram: string;
}

export function SiteFooter() {
  const [settings, setSettings] = React.useState<PublicSettings | null>(null);

  React.useEffect(() => {
    api<PublicSettings>("/api/settings/public")
      .then(setSettings)
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-2xl tracking-[0.35em] text-ink">RA</div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-secondary">
              {settings?.tagline ?? "Own Your Presence."} Affordable luxury fragrance, made for
              Pakistan.
            </p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest2 text-ink-muted">Shop</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/shop" className="text-ink-secondary hover:text-ink">All Fragrances</Link></li>
              <li><Link href="/quiz" className="text-ink-secondary hover:text-ink">Find Your RA</Link></li>
              <li><Link href="/shop?category=best-sellers" className="text-ink-secondary hover:text-ink">Best Sellers</Link></li>
              <li><Link href="/shop?category=new-arrivals" className="text-ink-secondary hover:text-ink">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest2 text-ink-muted">Company</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="text-ink-secondary hover:text-ink">About</Link></li>
              <li><Link href="/contact" className="text-ink-secondary hover:text-ink">Contact</Link></li>
              <li><Link href="/faq" className="text-ink-secondary hover:text-ink">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest2 text-ink-muted">Support</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/policy/shipping" className="text-ink-secondary hover:text-ink">Shipping Policy</Link></li>
              <li><Link href="/policy/returns" className="text-ink-secondary hover:text-ink">Returns &amp; Refunds</Link></li>
              <li><Link href="/policy/privacy" className="text-ink-secondary hover:text-ink">Privacy Policy</Link></li>
              <li><Link href="/policy/terms" className="text-ink-secondary hover:text-ink">Terms &amp; Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings?.storeName ?? "RA"} Fragrances. Own Your Presence.</p>
          <div className="flex items-center gap-4">
            {settings?.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink"
              >
                WhatsApp
              </a>
            )}
            {settings?.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                Instagram
              </a>
            )}
            {settings?.supportEmail && (
              <a href={`mailto:${settings.supportEmail}`} className="hover:text-ink">
                {settings.supportEmail}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
