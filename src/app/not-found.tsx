import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-32 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 font-display text-5xl text-ink">Scent not found</h1>
      <p className="mt-4 text-ink-secondary">
        The page you are looking for has moved or no longer exists.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center bg-accent px-6 text-sm tracking-wide text-background transition-colors hover:bg-accent-strong"
        >
          Return Home
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-11 items-center border border-border px-6 text-sm tracking-wide text-ink transition-colors hover:bg-surface"
        >
          Shop Fragrances
        </Link>
      </div>
    </div>
  );
}
