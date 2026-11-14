import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Boxes } from 'lucide-react';
import type { ReactNode } from 'react';
import { EQUIPMENT_OVERVIEW_FEATURED_STATUSES } from './equipmentOverviewStatuses';
import { equipmentStatusLabel, equipmentStatusValue } from '../../utils/equipmentStatus';
import { groupStatusCounts } from '@/shared/utils/statusSummary';
import styles from './EquipmentInventoryOverview.module.css';

interface EquipmentInventoryOverviewProps {
  total?: number;
  statuses?: Array<{ status: { value: string; label?: string }; count: number }>;
  unknownCount?: number;
  loading: boolean;
  resourceLabel?: string;
  statusTone?: (status: string) => string;
  scopeLabel?: string;
  footer?: ReactNode;
  featuredStatuses?: ReadonlyArray<{ key: string; label: string; description: string; tone: 'blue' | 'green' | 'amber' | 'violet' | 'slate' | 'red' }>;
  showAllOtherStatuses?: boolean;
  showOtherStatuses?: boolean;
  fillWidth?: boolean;
  featuredCounts?: Record<string, number | undefined>;
  normalizeStatus?: (status: unknown) => string;
  statusLabel?: (status: unknown) => string;
}

const featured = EQUIPMENT_OVERVIEW_FEATURED_STATUSES;

export default function EquipmentInventoryOverview({ total, statuses, unknownCount, loading, resourceLabel = 'equipment', scopeLabel = 'Current inventory by availability', footer, featuredStatuses = featured, showAllOtherStatuses = false, showOtherStatuses = true, fillWidth = false, statusTone, featuredCounts, normalizeStatus = equipmentStatusValue, statusLabel = equipmentStatusLabel }: EquipmentInventoryOverviewProps) {
  const groupedStatuses = statuses ? groupStatusCounts(statuses, normalizeStatus, statusLabel) : undefined;
  const statusCounts = new Map(groupedStatuses?.map(({ status, count }) => [status.value, count]) ?? []);
  const featuredKeys = new Set(featuredStatuses.map(({ key }) => normalizeStatus(key)));
  const otherStatuses = groupedStatuses?.filter(({ status, count }) => !featuredKeys.has(status.value) && (showAllOtherStatuses || count > 0)) ?? [];
  const hasCounts = total !== undefined && statuses !== undefined;

  return (
    <section className={`${styles.overview} ${fillWidth ? styles.fillWidth : ''}`} aria-label={`${resourceLabel} status overview`}>
      <div className={styles.heading}>
        <h2>Status overview</h2>
        <span>{scopeLabel}</span>
      </div>
      <div className={styles.content} aria-busy={loading}>
        <Card className={`${styles.total} ${styles.totalCard}`}>
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <span className={styles.totalLabel}>Total {resourceLabel}</span>
            <Boxes aria-hidden="true" className="tw:size-4 tw:text-primary" />
          </div>
          {loading ? <Skeleton className="tw:my-2 tw:h-8 tw:w-20" /> : <strong>{total?.toLocaleString() ?? '—'}</strong>}
          <span className={styles.totalHint}>{resourceLabel === 'equipment' ? 'Registered in this category' : 'Registered spaces'}</span>
        </Card>
        <div className={styles.statusGrid}>
          {featuredStatuses.map(({ key, label, description, tone }) => {
            const count = featuredCounts?.[key] ?? (statuses ? statusCounts.get(normalizeStatus(key)) ?? 0 : undefined);
            const percentage = hasCounts && total > 0 ? Math.min(100, ((count ?? 0) / total) * 100) : 0;
            return (
              <Card className={`${styles.status} ${styles[tone]}`} key={key}>
                <div className={styles.statusHeading}>
                  <span className={styles.statusLabel}><i className={styles.statusDot} aria-hidden="true" />{label}</span>
                  {loading ? <Skeleton className="tw:h-7 tw:w-12" /> : <strong>{count?.toLocaleString() ?? '—'}</strong>}
                </div>
                <span className={styles.statusDetail}>{description}</span>
                <div className={styles.meter}>
                  <div className={styles.track} role="progressbar" aria-label={`${label} share`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={loading || !hasCounts ? undefined : Math.round(percentage)}><span style={{ width: `${percentage}%` }} /></div>
                  <span>{loading ? '—' : hasCounts ? `${total > 0 ? Math.round(percentage) : 0}%` : '—'}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      {showOtherStatuses && !loading && (otherStatuses.length > 0 || (unknownCount ?? 0) > 0 || (showAllOtherStatuses && statuses !== undefined)) && (
        <div className={styles.additional}>
          <span className={styles.additionalLabel}>Other statuses</span>
          {otherStatuses.map(({ status, count }) => (
            <span className={`${styles.additionalItem} ${statusTone ? styles[statusTone(status.value)] : ''}`} key={status.value}>{status.label || statusLabel(status.value)} <strong>{count}</strong></span>
          ))}
          {(unknownCount ?? 0) > 0 && <span className={styles.additionalItem}>Unspecified status <strong>{unknownCount}</strong></span>}
        </div>
      )}
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}