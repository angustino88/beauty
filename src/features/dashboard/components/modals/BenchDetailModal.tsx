// src/features/dashboard/components/modals/BenchDetailModal.tsx
import { memo } from 'react';
import { Button, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { DashboardBenchDetail } from '../../types';
import InfoModal from './InfoModal';
import { useInfoModalStyles } from './InfoModal.styles';

export interface BenchDetailModalProps {
  modalBenchId?: number | null;
  modalLabId?: number | null;
  closeModal: () => void;
  benchDetail?: DashboardBenchDetail;
  labDetail?: DashboardBenchDetail;
  isDetailFetching: boolean;
}

export const BenchDetailModal = memo(function BenchDetailModal({
  modalBenchId,
  modalLabId,
  closeModal,
  benchDetail,
  labDetail,
  isDetailFetching,
}: BenchDetailModalProps) {
  const navigate = useNavigate();
  const { styles } = useInfoModalStyles();
  const activeId = modalBenchId ?? modalLabId ?? null;
  const detail = benchDetail ?? labDetail;

  return (
    <Modal
      width="min(840px, calc(100vw - 32px))"
      open={activeId !== null}
      loading={isDetailFetching && !detail}
      closable={false}
      onCancel={closeModal}
      style={{ top: '8%' }}
      styles={{
        body: {
          maxHeight: '72vh',
          overflowX: 'hidden',
          overflowY: 'auto',
          paddingRight: 8,
        },
      }}
      footer={[
        <Button key="close" onClick={closeModal}>
          Close
        </Button>,
        <Button
          key="book"
          type="primary"
          className={styles.bookButton}
          disabled={!detail}
          onClick={() => {
            if (detail) {
              navigate(`/booking-calendar?action=create&bench_ids=${detail.id}`);
            }
          }}
        >
          Book
        </Button>,
      ]}
    >
      {detail && <InfoModal data={detail} />}
    </Modal>
  );
});

export const LabDetailModal = BenchDetailModal;
export default BenchDetailModal;
