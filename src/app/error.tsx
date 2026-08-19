"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-32 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="mt-4 font-display text-4xl text-ink">Something went wrong</h1>
      <p className="mt-4 text-ink-secondary">
        Something went wrong. Please try again.
      </p>
      <Button variant="accent" className="mt-8" onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
