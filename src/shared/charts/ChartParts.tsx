import type { ReactNode } from 'react';
import { formatNumber, formatPercent, seriesStats } from './format';
import styles from './charts.module.css';

/* ── Tooltip ──────────────────────────────────────────────────────────────── */

interface TooltipEntry { name?: unknown; value?: unknown; color?: string; stroke?: string; fill?: string; payload?: Record<string, unknown> }

/**
 * Recharts `content` renderer. Card-styled, token-coloured, works in both themes.
 * `formatValue` formats each series value; `title` overrides the label.
 */
export function ChartTooltip({ active, payload, label, formatValue = (v) => formatNumber(v), title }: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: unknown;
  formatValue?: (value: unknown, entry: TooltipEntry) => ReactNode;
  title?: (label: unknown, payload: TooltipEntry[]) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  const heading = title ? title(label, payload) : label !== undefined && label !== '' ? String(label) : null;
  return (
    <div className={styles.tooltip}>
      {heading && <div className={styles.tooltipTitle}>{heading}</div>}
      {payload.map((entry, index) => {
        const color = entry.color ?? entry.stroke ?? (typeof entry.fill === 'string' && !entry.fill.startsWith('url(') ? entry.fill : undefined);
        return (
          <div className={styles.tooltipRow} key={`${String(entry.name)}-${index}`}>
            <i style={{ background: color ?? 'var(--lm-neutral-solid)' }} />
            <span>{String(entry.name ?? '')}</span>
            <strong>{formatValue(entry.value, entry)}</strong>
          </div>
        );
      })}
    </div>
  );
}

/* ── Legend ───────────────────────────────────────────────────────────────── */

export function ChartLegend({ items, align = 'start' }: {
  items: Array<{ label: string; color: string; dashed?: boolean }>;
  align?: 'start' | 'center' | 'end';
}) {
  return (
    <ul className={styles.legend} style={{ justifyContent: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center' }}>
      {items.map((item) => (
        <li key={item.label}>
          <i className={item.dashed ? styles.legendDash : undefined} style={{ background: item.dashed ? undefined : item.color, borderColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/* ── Ranked list (top-N style, like "sessions by country") ───────────────── */

export interface RankedItem { key: string; label: ReactNode; value: number; detail?: ReactNode; max?: number; color?: string }

/**
 * Top-N leaderboard: rank chip, name, value and a share bar. Reads far better
 * than a horizontal bar chart when there are ≤ 10 named categories.
 */
export function RankedList({ items, unit = '', color, formatValue = (v) => formatNumber(v), showShare = true }: {
  items: RankedItem[];
  unit?: string;
  color: string;
  formatValue?: (value: number) => string;
  showShare?: boolean;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const peak = Math.max(...items.map((item) => item.max ?? item.value), 0);
  return (
    <ol className={styles.ranked}>
      {items.map((item, index) => {
        const scale = item.max ?? peak;
        const pct = scale > 0 ? Math.min(100, (item.value / scale) * 100) : 0;
        const barColor = item.color ?? color;
        return (
          <li key={item.key}>
            <span className={styles.rank} style={index === 0 ? { background: barColor, color: '#fff', borderColor: barColor } : undefined}>{index + 1}</span>
            <div className={styles.rankedBody}>
              <div className={styles.rankedHead}>
                <span className={styles.rankedLabel}>{item.label}</span>
                <span className={styles.rankedValue}>
                  <strong>{formatValue(item.value)}</strong>{unit && <small>{unit}</small>}
                  {showShare && !item.max && <em>{formatPercent(item.value, total)}</em>}
                  {showShare && item.max ? <em>{formatPercent(item.value, item.max)}</em> : null}
                </span>
              </div>
              <div className={styles.rankedTrack}>
                <span style={{ width: `${pct}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${barColor} 55%, transparent), ${barColor})` }} />
              </div>
              {item.detail && <span className={styles.rankedDetail}>{item.detail}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Mini bars + min/avg/max (KPI sparkline, as in the reference cards) ──── */

export function MiniBars({ values, color, height = 34, highlightLast = true }: {
  values: number[]; color: string; height?: number; highlightLast?: boolean;
}) {
  const max = Math.max(...values, 0);
  const shown = values.slice(-24);
  return (
    <div className={styles.miniBars} style={{ height }} aria-hidden="true">
      {shown.map((value, index) => (
        <span
          key={index}
          style={{
            height: `${max > 0 ? Math.max(8, (value / max) * 100) : 8}%`,
            background: color,
            opacity: highlightLast && index === shown.length - 1 ? 1 : 0.42,
          }}
        />
      ))}
    </div>
  );
}

export function StatTriplet({ values, format = (v) => formatNumber(v, 0) }: { values: number[]; format?: (value: number) => string }) {
  const stats = seriesStats(values);
  if (!stats) return null;
  return (
    <dl className={styles.triplet}>
      <div><dt>Min</dt><dd>{format(stats.min)}</dd></div>
      <div><dt>Avg</dt><dd>{format(stats.avg)}</dd></div>
      <div><dt>Max</dt><dd>{format(stats.max)}</dd></div>
    </dl>
  );
}

export function TrendChip({ value, suffix = '%' }: { value: number | null | undefined; suffix?: string }) {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) {
    return <span className={`${styles.trend} ${styles.trendFlat}`}><i />Stable</span>;
  }
  const up = value > 0;
  return (
    <span className={`${styles.trend} ${up ? styles.trendUp : styles.trendDown}`}>
      <i />{up ? 'Growing' : 'Declining'} {up ? '+' : '−'}{Math.abs(value)}{suffix}
    </span>
  );
}

export function ChartEmpty({ children = 'No data for this period' }: { children?: ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}
