"use client";

// Lightweight, dependency-free SVG charts (avoid heavy chart libraries).

export function LineChart({
  data,
  height = 180,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const w = 600;
  const h = height;
  const max = Math.max(1, ...data.map((d) => d.value));
  const pad = 24;
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Chart">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#262626" />
      <polyline
        points={`${path} L${points[points.length - 1]?.[0]},${h - pad} L${points[0]?.[0]},${h - pad}`}
        fill="rgba(200,169,107,0.08)"
        stroke="none"
      />
      <path d={path} fill="none" stroke="#C8A96B" strokeWidth="2" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#C8A96B" />
      ))}
      {data.map((d, i) =>
        i % Math.max(1, Math.ceil(data.length / 6)) === 0 ? (
          <text key={i} x={pad + i * stepX} y={h - 6} fill="#6E6A62" fontSize="9" textAnchor="middle">
            {d.label.slice(5)}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function BarList({
  data,
}: {
  data: { label: string; value: number; sub?: string }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex justify-between text-xs">
            <span className="text-ink-secondary">{d.label}</span>
            <span className="text-ink">{d.value.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-surface-2">
            <div
              className="h-full bg-accent"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          {d.sub && <p className="mt-0.5 text-[10px] text-ink-muted">{d.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
