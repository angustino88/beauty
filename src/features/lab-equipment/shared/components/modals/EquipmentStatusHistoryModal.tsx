import { useState } from 'react';
import { Button, Descriptions, Empty, Modal, Pagination, Spin, Typography } from 'antd';
import { ArrowRightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { EquipmentStatusChangeRead } from '@/shared/api/generated/api';
import EquipmentStatus from '../status/EquipmentStatus';
import styles from './EquipmentStatusHistoryModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  data: EquipmentStatusChangeRead[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
}

const formatKey = (key: string) => key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatValue = (value: unknown): string => {
  if (value == null || value === '') return 'Not set';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const record = value as { display_name?: unknown; label?: unknown; name?: unknown; username?: unknown };
    const label = record.display_name ?? record.label ?? record.name ?? record.username;
    if (typeof label === 'string' && label.trim()) return label;
    return JSON.stringify(value);
  }
  return String(value);
};

const actorName = (item: EquipmentStatusChangeRead): string =>
  item.actor?.display_name?.trim() || item.actor?.username || 'Unknown actor';

function StatusTransition({ item }: { item: EquipmentStatusChangeRead }) {
  return (
    <div className={styles.transition} aria-label={`Status changed from ${item.previous_display_status?.label ?? 'not set'} to ${item.display_status.label}`}>
      <div className={styles.statusStep}>
        <span className={styles.stepLabel}>Previous</span>
        {item.previous_display_status
          ? <EquipmentStatus status={item.previous_display_status} />
          : <span className={styles.noPrevious}>Not set</span>}
      </div>
      <ArrowRightOutlined className={styles.arrow} aria-hidden="true" />
      <div className={styles.statusStep}>
        <span className={styles.stepLabel}>New</span>
        <EquipmentStatus status={item.display_status} />
      </div>
    </div>
  );
}

export default function EquipmentStatusHistoryModal({
  open, onClose, title, data, loading, page, pageSize, total, onPageChange,
}: Props) {
  const [selected, setSelected] = useState<EquipmentStatusChangeRead | null>(null);
  const details = selected ? Object.entries(selected.details ?? {}) : [];

  const close = () => {
    setSelected(null);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={close}
        footer={null}
        title={<div className={styles.heading}><strong>Status history</strong><span>{title}</span></div>}
        width={800}
        destroyOnHidden
        className={styles.modal}
      >
        <Spin spinning={loading}>
          <div className={styles.list} aria-busy={loading}>
            {data.length === 0 && !loading && <Empty description="No status changes yet" />}
            {data.map((item, index) => (
              <article className={styles.event} key={`${item.occurred_at}-${page}-${index}`}>
                <div className={styles.eventHeader}>
                  <div className={styles.metadata}>
                    <Typography.Text strong>{dayjs(item.occurred_at).format('DD MMM YYYY, HH:mm')}</Typography.Text>
                    <span className={styles.actor}>by {actorName(item)}</span>
                  </div>
                  <Button type="text" icon={<InfoCircleOutlined />} onClick={() => setSelected(item)}>
                    Details
                  </Button>
                </div>
                <StatusTransition item={item} />
                {item.reason?.trim() && <p className={styles.reason}><span>Reason</span>{item.reason}</p>}
              </article>
            ))}
          </div>
        </Spin>
        {total > 0 && (
          <div className={styles.pagination}>
            <span>{total} {total === 1 ? 'change' : 'changes'}</span>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={[10, 20, 50]}
              onChange={onPageChange}
              disabled={loading}
              size="small"
            />
          </div>
        )}
      </Modal>

      <Modal
        open={selected !== null && open}
        onCancel={() => setSelected(null)}
        footer={null}
        title="Status change details"
        width={620}
        destroyOnHidden
        className={styles.detailsModal}
      >
        {selected && (
          <div className={styles.detailsContent}>
            <StatusTransition item={selected} />
            <Descriptions column={1} bordered size="small" className={styles.details}>
              <Descriptions.Item label="Changed on">{dayjs(selected.occurred_at).format('DD MMM YYYY, HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="Changed by">{actorName(selected)}</Descriptions.Item>
              <Descriptions.Item label="Reason">{selected.reason?.trim() || 'No reason provided'}</Descriptions.Item>
              {details.map(([key, value]) => (
                <Descriptions.Item key={key} label={formatKey(key)}>{formatValue(value)}</Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  );
}