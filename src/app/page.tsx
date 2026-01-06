'use client';

import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ImpactCalculators from './bank-rate/ImpactCalculators';

interface DataPoint {
  date: string;
  value: number;
}

interface BankRateData {
  seriesCode: string;
  points: DataPoint[];
  changesOnly: DataPoint[];
  latest: DataPoint | null;
}

type RangeKey = "1M" | "6M" | "1Y" | "5Y" | "ALL";

function parseISO(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatMonthYear(dateStr: string) {
  const dt = parseISO(dateStr);
  return dt.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function formatFullDate(dateStr: string) {
  const dt = parseISO(dateStr);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function subtractRange(from: Date, range: RangeKey) {
  const d = new Date(from);
  if (range === "1M") d.setMonth(d.getMonth() - 1);
  if (range === "6M") d.setMonth(d.getMonth() - 6);
  if (range === "1Y") d.setFullYear(d.getFullYear() - 1);
  if (range === "5Y") d.setFullYear(d.getFullYear() - 5);
  return d;
}

function pctChange(start: number, end: number) {
  if (!isFinite(start) || start === 0) return 0;
  return ((end - start) / start) * 100;
}

function PillButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm rounded-full transition font-medium",
        active
          ? "bg-accent text-white shadow-sm"
          : "bg-bg-card text-text-secondary hover:bg-accent-soft border border-border",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  const v = payload[0]?.value as number;

  return (
    <div className="rounded-xl border border-border bg-bg-card px-3 py-2 shadow-lg">
      <div className="text-xs text-text-muted">{formatFullDate(label)}</div>
      <div className="mt-0.5 text-sm font-semibold text-text-primary font-mono">
        {v.toFixed(2)}%
      </div>
    </div>
  );
}

function CrosshairCursor(props: any) {
  const { points, height } = props;
  if (!points?.length) return null;
  const x = points[0].x;

  return (
    <line
      x1={x}
      x2={x}
      y1={0}
      y2={height}
      stroke="var(--accent)"
      strokeDasharray="4 4"
      strokeWidth={1.5}
      opacity={0.3}
    />
  );
}

export default function Home() {
  const [data, setData] = useState<BankRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("1Y");

  // Stabilize the dependency to avoid unnecessary re-renders
  const changesOnlyRef = data?.changesOnly ?? null;

  const sorted = useMemo(() => {
    if (!changesOnlyRef?.length) return [];
    return [...changesOnlyRef].sort((a, b) => a.date.localeCompare(b.date));
  }, [changesOnlyRef]);

  const filtered = useMemo(() => {
    if (!sorted.length) return [];
    if (range === "ALL") return sorted;

    const lastDate = parseISO(sorted[sorted.length - 1].date);
    const minDate = subtractRange(lastDate, range);

    return sorted.filter((p) => parseISO(p.date) >= minDate);
  }, [sorted, range]);

  const headerStats = useMemo(() => {
    if (!filtered.length) return null;

    const start = filtered[0].value;
    const end = filtered[filtered.length - 1].value;

    const change = pctChange(start, end);
    const sign = change >= 0 ? "+" : "";
    const badgeText = `${sign}${change.toFixed(2)}%`;
    const badgeClass =
      change >= 0 ? "bg-positive text-white" : "bg-negative text-white";

    return {
      endValue: end,
      badgeText,
      badgeClass,
      startDate: filtered[0].date,
      endDate: filtered[filtered.length - 1].date,
    };
  }, [filtered]);

  const yDomain = useMemo(() => {
    if (!filtered.length) return ["auto", "auto"] as const;
    const vals = filtered.map((d) => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.12 || 0.5;
    return [min - pad, max + pad] as const;
  }, [filtered]);

  useEffect(() => {
    // Fetch data from our API route
    fetch('/api/boe/bank-rate')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json.error) {
          throw new Error(json.error);
        }
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'An error occurred');
        setLoading(false);
      });
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-page">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading Bank Rate data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg-page">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Error Loading Data</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Hero Section */}
      <section 
        className="relative min-h-[60vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/hero-background.png)' }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-semibold text-text-primary mb-4">
            Bank of England Interest Rate
          </h1>
          <p className="text-lg text-text-secondary">
            Official Bank Rate (Series Code: {data?.seriesCode || 'IUDBEDR'})
          </p>
          {data?.latest && (
            <div className="mt-8">
              <div className="inline-block">
                <div className="text-6xl md:text-7xl font-semibold text-text-primary font-mono mb-2">
                  {data.latest.value.toFixed(2)}%
                </div>
                <p className="text-sm text-text-muted">
                  As of {formatFullDate(data.latest.date)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {data && data.changesOnly.length > 0 && filtered.length > 0 && (
            <div className="bg-bg-card rounded-2xl p-5 sm:p-6 border border-border shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
                <div>
                  <div className="text-sm font-medium text-text-secondary mb-1">
                    Bank of England Official Bank Rate
                  </div>

                  {headerStats ? (
                    <>
                      <div className="mt-2 flex items-end gap-3 flex-wrap">
                        <div className="text-4xl font-semibold tracking-tight text-text-primary font-mono">
                          {headerStats.endValue.toFixed(2)}%
                        </div>
                        <span className={`mb-1 rounded-full px-2.5 py-1 text-xs font-semibold ${headerStats.badgeClass}`}>
                          {headerStats.badgeText} {range === "ALL" ? "all time" : range.toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-text-muted">
                        {formatFullDate(headerStats.startDate)} to {formatFullDate(headerStats.endDate)}
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 text-text-secondary">No data</div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    {(["1M", "6M", "1Y", "5Y", "ALL"] as RangeKey[]).map((k) => (
                      <PillButton key={k} active={range === k} onClick={() => setRange(k)}>
                        {k}
                      </PillButton>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-[320px] w-full mt-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filtered} margin={{ top: 10, right: 18, left: 6, bottom: 10 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                      tickFormatter={formatMonthYear}
                      minTickGap={28}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                      domain={yDomain as any}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={<CrosshairCursor />}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--accent)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: "var(--accent)", stroke: "white" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 text-xs text-text-muted">
                Tip: hover the line to see the crosshair and exact date.
              </div>
            </div>
          )}

          {/* Impact Calculators */}
          {data?.latest && (
            <ImpactCalculators latestRate={data.latest.value} />
          )}
        </div>
      </section>

      {/* Footer Section */}
      <footer 
        className="relative py-16 px-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/footer-background.png)' }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <p className="text-sm text-text-secondary">
            Data sourced from the Bank of England Statistical Database
          </p>
          <p className="text-xs text-text-muted mt-2">
            Series Code: {data?.seriesCode || 'IUDBEDR'} | Last updated: {data?.latest ? formatFullDate(data.latest.date) : 'N/A'}
          </p>
        </div>
      </footer>
    </div>
  );
}
