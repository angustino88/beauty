import { Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { LicenseObservationRead } from '@/shared/api/generated/api';
import { carrierLabel, inventoryDifferences, observationPresentation } from './presentation';
import styles from './LicenseChecks.module.css';

const TONE_COLORS = { success: 'green', warning: 'gold', error: 'red', processing: 'blue', default: 'default' } as const;
const date = (iso: string | null) => (iso ? dayjs(iso).format('DD MMM YYYY') : 'No expiry');

export function observationColumns(options: { showComputer?: boolean } = {}): ColumnsType<LicenseObservationRead> {
  const columns: ColumnsType<LicenseObservationRead> = [
    {
      title: 'License',
      key: 'product',
      render: (_, row) => (
        <div className={styles.stack}>
          <strong>{row.product_name}{row.max_version ? ` ${row.max_version}` : ''}</strong>
          {row.license_serial && <span className={styles.mono}>{row.license_serial}</span>}
          {row.license && <span className={styles.muted}>Inventory: {row.license.name}</span>}
        </div>
      ),
    },
    {
      title: 'Carrier',
      key: 'carrier',
      render: (_, row) => <span>{carrierLabel(row)}</span>,
    },
    {
      title: 'Expires',
      key: 'expires',
      render: (_, row) => {
        const differences = inventoryDifferences(row);
        return (
          <div className={styles.stack}>
            <span className={differences.includes('expiry') ? styles.differs : undefined}>{date(row.expires_at)}</span>
            {row.inventory && differences.includes('expiry') && (
              <span className={styles.muted}>Inventory: {date(row.inventory.expires_at)}</span>
            )}
            {row.is_reactivatable && <span className={styles.muted}>Reactivatable</span>}
            {row.final_expires_at === null && row.expires_at && <span className={styles.muted}>License itself is perpetual</span>}
          </div>
        );
      },
    },
    {
      title: 'Match',
      key: 'status',
      render: (_, row) => {
        const presentation = observationPresentation(row);
        return (
          <div className={styles.stack}>
            <Tag color={TONE_COLORS[presentation.tone]} style={{ width: 'fit-content' }}>{row.status.label}</Tag>
            {presentation.fix && <span className={styles.muted}>{presentation.fix}</span>}
          </div>
        );
      },
    },
    {
      title: 'Last seen',
      key: 'last_seen',
      width: 150,
      render: (_, row) => (
        <Tooltip title={`First seen ${dayjs(row.first_seen_at).format('DD MMM YYYY, HH:mm')} · ${row.check.name}`}>
          <span>{row.removed_at ? `Gone since ${dayjs(row.removed_at).format('DD MMM HH:mm')}` : dayjs(row.last_seen_at).format('DD MMM YYYY, HH:mm')}</span>
        </Tooltip>
      ),
    },
  ];
  if (options.showComputer !== false) {
    columns.splice(1, 0, { title: 'Computer', key: 'computing', render: (_, row) => row.computing.name });
  }
  return columns;
}
