"use client";

import { useState } from "react";

export type Series = {
  key: string;
  label: string;
  /** Tailwind-ish hex; used for both the stroke and the fill gradient. */
  color: string;
  values: number[];
  /** Render as currency (cents) rather than a plain count. */
  money?: boolean;
};

/**
 * Inline-SVG trend chart — no charting library.
 *
 * The page's Content-Security-Policy only permits scripts from a small CDN
 * allowlist, and pulling in a chart bundle for two lines would cost more than
 * it earns. Everything here is a path built from the data, so it renders
 * server-side-identical, scales with the container, and themes with CSS.
 *
 * Each series is normalised against its OWN maximum. Impressions and dollars
 * share an x-axis but not a y-scale — plotting 40,000 impressions and $12 of
 * spend on one axis would flatten the money line to the baseline.
 */
export default function TrendChart({
  labels,
  series,
  height = 180,
}: {
  labels: string[];
  series: Series[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 600;
  const H = height;
  const PAD = { top: 12, right: 8, bottom: 22, left: 8 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const n = labels.length;

  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);

  function pathFor(values: number[]) {
    const max = Math.max(...values, 1);
    const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
    const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
    const area = `${line} L${x(values.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`;
    return { line, area };
  }

  const hasData = series.some((s) => s.values.some((v) => v > 0));

  function fmt(value: number, money?: boolean) {
    if (money) return `$${(value / 100).toFixed(2)}`;
    return value.toLocaleString();
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs font-medium">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{s.label}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {fmt(
                hover !== null
                  ? s.values[hover] ?? 0
                  : s.values.reduce((a, b) => a + b, 0),
                s.money,
              )}
            </span>
          </span>
        ))}
        {hover !== null && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            on {labels[hover]}
          </span>
        )}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height }}
          preserveAspectRatio="none"
          role="img"
          aria-label="Delivery over time"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal guides */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={PAD.top + plotH * t}
              y2={PAD.top + plotH * t}
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-800"
              strokeWidth="1"
            />
          ))}

          {hasData &&
            series.map((s) => {
              const { line, area } = pathFor(s.values);
              return (
                <g key={s.key}>
                  <path d={area} fill={`url(#grad-${s.key})`} />
                  <path
                    d={line}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}

          {/* Hover marker */}
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="currentColor"
              className="text-gray-500 dark:text-gray-400"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Invisible hit targets — one column per day. */}
          {labels.map((_, i) => (
            <rect
              key={i}
              x={x(i) - plotW / Math.max(n - 1, 1) / 2}
              y={PAD.top}
              width={plotW / Math.max(n - 1, 1)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {!hasData && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No views yet
            </p>
          </div>
        )}
      </div>

      <div className="mt-1 flex justify-between text-[11px] text-gray-600 dark:text-gray-400">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}
