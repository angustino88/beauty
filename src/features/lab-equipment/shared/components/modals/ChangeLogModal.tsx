import { useState } from 'react';
import { Descriptions, Modal, Table, Tag, Typography } from 'antd';
import { useGetUsersQuery } from '../../api/dropdownApi';
import type { IChangeLog } from '../../types/equipment.types';
import { createChangeLogColumns } from '../../columns/changeLogColumns';
import styles from '../layout/EquipmentTable.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  data: IChangeLog[];
  loading?: boolean;
  title?: string;
}

const formatKeyText = (key: string) =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatValue = (
  value: unknown,
  key: string,
  users: Array<{ id: number; username: string; display_name?: string }>,
): string => {
  if (value == null || value === '') return 'Not set';
  if (key === 'responsible') {
    const userId = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
    const user = users.find((item) => item.id === userId);
    if (user) return user.display_name?.trim() || user.username || String(user.id);
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as { display_name?: unknown; username?: unknown; name?: unknown };
    const label = record.display_name ?? record.username ?? record.name;
    if (typeof label === 'string' && label.trim()) return label;
    return JSON.stringify(value);
  }
  return String(value);
};

export default function ChangeLogModal({
  open,
  onClose,
  data,
  loading,
  title = 'Change History',
}: Props) {
  const [selectedChange, setSelectedChange] = useState<IChangeLog | null>(null);
  const { data: users = [] } = useGetUsersQuery();
  const details = selectedChange?.status_data ?? {};
  const hasTransition = selectedChange?.old_value != null || selectedChange?.new_value != null;

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title={title}
        width={800}
        destroyOnClose
        maskClosable
        style={{ top: '10%' }}
      >
        <Table
          className={styles.table}
          columns={createChangeLogColumns(setSelectedChange)}
          dataSource={data}
          rowKey="id"
          loading={loading}
          sticky={{ offsetHeader: 60 }}
          scroll={{ y: 'calc(80vh - 180px)' }}
          rowClassName={(_, index) => (index % 2 === 1 ? 'stripedRow' : '')}
          pagination={{ pageSize: 10 }}
        />
      </Modal>

      <Modal
        open={selectedChange != null}
        onCancel={() => setSelectedChange(null)}
        footer={null}
        title="Change details"
        width={640}
        destroyOnClose
        className={styles.changeDetailsModal}
      >
        {selectedChange && (
          <Descriptions className={styles.changeDetails} bordered column={1} size="small">
            <Descriptions.Item label="Field">
              <Typography.Text className={styles.changedField} strong>
                {selectedChange.field_changed ? formatKeyText(selectedChange.field_changed) : 'Status update'}
              </Typography.Text>
            </Descriptions.Item>
            {hasTransition && (
              <Descriptions.Item label="Value change">
                <div className={styles.valueTransition}>
                  <div className={styles.transitionValue}>
                    <Typography.Text className={styles.valueCaption}>Previous</Typography.Text>
                    <Tag className={styles.previousValue}>{formatValue(selectedChange.old_value, '', users)}</Tag>
                  </div>
                  <Typography.Text className={styles.transitionArrow}>to</Typography.Text>
                  <div className={styles.transitionValue}>
                    <Typography.Text className={styles.valueCaption}>Current</Typography.Text>
                    <Tag className={styles.currentValue}>{formatValue(selectedChange.new_value, '', users)}</Tag>
                  </div>
                </div>
              </Descriptions.Item>
            )}
            {Object.entries(details).map(([key, value]) => (
              <Descriptions.Item key={key} label={formatKeyText(key)}>
                <Typography.Text className={styles.detailValue}>{formatValue(value, key, users)}</Typography.Text>
              </Descriptions.Item>
            ))}
            {!hasTransition && Object.keys(details).length === 0 && (
              <Descriptions.Item label="Details">
                <Typography.Text type="secondary">No additional details</Typography.Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </>
  );
}
