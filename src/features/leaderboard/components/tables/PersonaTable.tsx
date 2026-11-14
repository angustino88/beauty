import { Table } from 'antd';
import type { RankedPersonaItem } from '../../types';
import { personaColumns } from './columns/personaColumns';
import styles from './LeaderboardTable.module.css';

interface PersonaTableProps {
  data: RankedPersonaItem[];
  loading: boolean;
  currentUserId?: number | null;
  onRowClick?: (record: RankedPersonaItem) => void;
}

export function PersonaTable({ data, loading, currentUserId, onRowClick }: PersonaTableProps) {
  return (
    <Table<RankedPersonaItem>
      className={styles.table}
      sticky={{ offsetHeader: 0 }}
      scroll={{ x: 'max-content', y: 'calc(100vh - 260px)' }}
      columns={personaColumns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={false}
      size="small"
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: {
          ...(currentUserId != null && record.id === currentUserId
            ? { background: 'var(--lm-primary-bg)', fontWeight: 600 }
            : {}),
          cursor: onRowClick ? 'pointer' : 'default',
        },
      })}
      locale={{ emptyText: 'No data for the selected period' }}
    />
  );
}
