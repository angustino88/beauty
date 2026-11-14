import { useState } from 'react';
import { ArrowRightOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Descriptions, Empty, Modal, Pagination, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import type { LabsChoiceReferenceRead } from '@/shared/api/generated/api';
import styles from '@/features/lab-equipment/shared/components/modals/EquipmentStatusHistoryModal.module.css';
import SpaceStatusBadge from './SpaceStatusBadge';

export interface SpaceStatusHistoryRecord {
  id: number;
  status: LabsChoiceReferenceRead;
  metadata?: unknown;
  actor?: { display_name?: string | null; username?: string | null } | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  data: SpaceStatusHistoryRecord[];
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

const actorName = (item: SpaceStatusHistoryRecord): string =>
  item.actor?.display_name?.trim() || item.actor?.username || 'Unknown actor';

function StatusTransition({ current }: { current: SpaceStatusHistoryRecord }) {
  return (
    <div className={styles.transition} aria-label={`Recorded status: ${current.status.label}`}>
      <div className={styles.statusStep}>
        <span className={styles.stepLabel}>Previous</span>
        <span className={styles.noPrevious}>Unavailable</span>
      </div>
      <ArrowRightOutlined className={styles.arrow} aria-hidden="true" />
      <div className={styles.statusStep}>
        <span className={styles.stepLabel}>New</span>
        <SpaceStatusBadge status={current.status} label={current.status.label} />
      </div>
    </div>
  );
}

export default function SpaceStatusHistoryModal({
  open, onClose, title, data, loading, page, pageSize, total, onPageChange,
}: Props) {
  const [selected, setSelected] = useState<SpaceStatusHistoryRecord | null>(null);
  const details = Object.entries(
    selected?.metadata && typeof selected.metadata === 'object' && !Array.isArray(selected.metadata)
      ? selected.metadata as Record<string, unknown>
      : {},
  );

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
            {data.map((item) => (
              <article className={styles.event} key={item.id}>
                <div className={styles.eventHeader}>
                  <div className={styles.metadata}>
                    <Typography.Text strong>{dayjs(item.created_at).format('DD MMM YYYY, HH:mm')}</Typography.Text>
                    <span className={styles.actor}>by {actorName(item)}</span>
                  </div>
                  <Button type="text" icon={<InfoCircleOutlined />} onClick={() => setSelected(item)}>
                    Details
                  </Button>
                </div>
                <StatusTransition current={item} />
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
            <StatusTransition current={selected} />
            <Descriptions column={1} bordered size="small" className={styles.details}>
              <Descriptions.Item label="Changed on">{dayjs(selected.created_at).format('DD MMM YYYY, HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="Changed by">{actorName(selected)}</Descriptions.Item>
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