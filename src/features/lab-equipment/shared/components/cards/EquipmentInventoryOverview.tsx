import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { EQUIPMENT_OVERVIEW_FEATURED_STATUSES } from './equipmentOverviewStatuses';
import { equipmentStatusLabel, equipmentStatusValue } from '../../utils/equipmentStatus';
import { groupStatusCounts } from '@/shared/utils/statusSummary';
import { ATTENTION_TONES, toTone, type StatusTone } from '@/shared/status/statusTone';
import styles from './EquipmentInventoryOverview.module.css';

type FeaturedStatus = { key: string; label: string; description?: string; tone: StatusTone | string };

interface EquipmentInventoryOverviewProps {
  total?: number;
  statuses?: Array<{ status: { value: string; label?: string }; count: number }>;
  unknownCount?: number;
  loading: boolean;
  resourceLabel?: string;
  statusTone?: (status: string) => string;
  scopeLabel?: string;
  footer?: ReactNode;
  featuredStatuses?: ReadonlyArray<FeaturedStatus>;
  showAllOtherStatuses?: boolean;
  showOtherStatuses?: boolean;
  showAvailabilityInsights?: boolean;
  fillWidth?: boolean;
  featuredCounts?: Record<string, number | undefined>;
  normalizeStatus?: (status: unknown) => string;
  statusLabel?: (status: unknown) => string;
}

interface Segment { key: string; label: string; count: number; tone: StatusTone }

const percent = (count: number, total: number) => (total > 0 ? (count / total) * 100 : 0);
const formatPercent = (value: number) => (value > 0 && value < 1 ? '<1%' : `${Math.round(value)}%`);

/**
 * Status overview: one card that answers "how much is ready, and what needs attention?"
 * A stacked bar shows the whole distribution; tiles explain each featured status.
 */
export default function EquipmentInventoryOverview({
  total, statuses, unknownCount, loading, resourceLabel = 'equipment',
  scopeLabel = 'Current inventory by availability', footer,
  featuredStatuses = EQUIPMENT_OVERVIEW_FEATURED_STATUSES, showAllOtherStatuses = false, showOtherStatuses = true,
  fillWidth = false, statusTone, featuredCounts, showAvailabilityInsights = true,
  normalizeStatus = equipmentStatusValue, statusLabel = equipmentStatusLabel,
}: EquipmentInventoryOverviewProps) {
  const grouped = statuses ? groupStatusCounts(statuses, normalizeStatus, statusLabel) : undefined;
  const counts = new Map(grouped?.map(({ status, count }) => [status.value, count]) ?? []);
  const featuredKeys = new Set(featuredStatuses.map(({ key }) => normalizeStatus(key)));
  const hasCounts = total !== undefined && statuses !== undefined;
  const safeTotal = total ?? 0;

  const featured: Array<Segment & { description?: string }> = featuredStatuses.map(({ key, label, description, tone }) => ({
    key, label, description, tone: toTone(tone),
    count: featuredCounts?.[key] ?? counts.get(normalizeStatus(key)) ?? 0,
  }));
  const others: Segment[] = (grouped ?? [])
    .filter(({ status, count }) => !featuredKeys.has(status.value) && (showAllOtherStatuses || count > 0))
    .map(({ status, count }) => ({
      key: status.value, label: status.label || statusLabel(status.value), count,
      tone: toTone(statusTone?.(status.value)),
    }));
  const unknown = unknownCount ?? 0;
  const segments: Segment[] = [
    ...featured, ...others,
    ...(unknown > 0 ? [{ key: '__unknown', label: 'Unspecified', count: unknown, tone: 'neutral' as const }] : []),
  ].filter(({ count }) => count > 0);

  const ready = [...featured, ...others].filter(({ tone }) => tone === 'success').reduce((sum, { count }) => sum + count, 0);
  const attention = [...featured, ...others].filter(({ tone }) => ATTENTION_TONES.has(tone)).reduce((sum, { count }) => sum + count, 0);
  const visibleOthers = showOtherStatuses ? others : [];

  return (
    <section className={`${styles.overview} ${fillWidth ? styles.fillWidth : ''}`} aria-label={`${resourceLabel} status overview`}>
      <div className={styles.heading}>
        <h2>Status overview</h2>
        <span>{scopeLabel}</span>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>

      <div className={styles.card} aria-busy={loading}>
        <div className={styles.summary}>
          <div className={styles.total}>
            <span className={styles.totalLabel}>Total {resourceLabel}</span>
            {loading ? <Skeleton className="tw:my-1 tw:h-9 tw:w-24" /> : <strong>{hasCounts ? safeTotal.toLocaleString() : '—'}</strong>}
          </div>
          {showAvailabilityInsights && !loading && hasCounts && safeTotal > 0 && (
            <div className={styles.insights}>
              <span className={`${styles.insight} ${styles.insightReady}`}>
                <CheckCircle2 aria-hidden="true" />
                <strong>{formatPercent(percent(ready, safeTotal))}</strong> ready
              </span>
              <span className={`${styles.insight} ${attention > 0 ? styles.insightAttention : styles.insightCalm}`}>
                <AlertTriangle aria-hidden="true" />
                <strong>{attention.toLocaleString()}</strong> {attention === 1 ? 'needs' : 'need'} attention
              </span>
            </div>
          )}
        </div>

        <div className={styles.distribution}>
          {loading ? <Skeleton className="tw:h-2.5 tw:w-full tw:rounded-full" /> : (
            <div
              className={styles.bar}
              role="img"
              aria-label={segments.length
                ? `Distribution: ${segments.map(({ label, count }) => `${label} ${count}`).join(', ')}`
                : 'No status data'}
            >
              {hasCounts && segments.map((segment) => (
                <span
                  key={segment.key}
                  className={`${styles.segment} ${styles[segment.tone]}`}
                  style={{ flexGrow: segment.count }}
                  title={`${segment.label}: ${segment.count.toLocaleString()} (${formatPercent(percent(segment.count, safeTotal))})`}
                />
              ))}
            </div>
          )}

          <ul className={styles.tiles}>
            {featured.map((status) => {
              const share = percent(status.count, safeTotal);
              return (
                <li key={status.key} className={`${styles.tile} ${styles[status.tone]} ${hasCounts && status.count === 0 ? styles.tileEmpty : ''}`}>
                  <span className={styles.tileLabel}><i className={styles.dot} aria-hidden="true" />{status.label}</span>
                  <span className={styles.tileValue}>
                    {loading ? <Skeleton className="tw:h-6 tw:w-10" /> : <strong>{hasCounts ? status.count.toLocaleString() : '—'}</strong>}
                    {!loading && hasCounts && <span className={styles.tileShare}>{formatPercent(share)}</span>}
                  </span>
                  {status.description && <span className={styles.tileDescription}>{status.description}</span>}
                </li>
              );
            })}
          </ul>
        </div>

        {!loading && (visibleOthers.length > 0 || unknown > 0) && (
          <div className={styles.others}>
            <span className={styles.othersLabel}>Other statuses</span>
            {visibleOthers.map((status) => (
              <span className={`${styles.chip} ${styles[status.tone]}`} key={status.key}>
                <i className={styles.dot} aria-hidden="true" />{status.label}<strong>{status.count.toLocaleString()}</strong>
              </span>
            ))}
            {unknown > 0 && (
              <span className={`${styles.chip} ${styles.neutral}`}>
                <i className={styles.dot} aria-hidden="true" />Unspecified<strong>{unknown.toLocaleString()}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
