export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6">
          <p className="eyebrow">Policy</p>
          <h1 className="mt-4 font-display text-5xl text-ink">{title}</h1>
          <p className="mt-3 text-sm text-ink-muted">Last updated: {updated}</p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-6 text-sm leading-relaxed text-ink-secondary">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
