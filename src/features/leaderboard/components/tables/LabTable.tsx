import { Table } from 'antd';
import type { RankedLabItem } from '../../types';
import { labColumns } from './columns/labColumns';
import styles from './LeaderboardTable.module.css';

interface LabTableProps {
  data: RankedLabItem[];
  loading: boolean;
  onRowClick?: (record: RankedLabItem) => void;
}

export function LabTable({ data, loading, onRowClick }: LabTableProps) {
  return (
    <Table<RankedLabItem>
      className={styles.table}
      sticky={{ offsetHeader: 0 }}
      scroll={{ x: 'max-content', y: 'calc(100vh - 260px)' }}
      columns={labColumns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={false}
      size="small"
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: { cursor: onRowClick ? 'pointer' : 'default' },
      })}
      locale={{ emptyText: 'No data for the selected period' }}
    />
  );
}
