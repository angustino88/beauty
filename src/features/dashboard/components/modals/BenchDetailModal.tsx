// src/features/dashboard/components/modals/BenchDetailModal.tsx
import { memo } from 'react';
import { Button, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { NotifyWhenFreeButton } from '@/features/booking/slot-alerts/NotifyWhenFreeButton';
import type { DashboardBenchDetail } from '../../types';
import InfoModal from './InfoModal';
import { useInfoModalStyles } from './InfoModal.styles';

export interface BenchDetailModalProps {
  modalBenchId: number | null;
  closeModal: () => void;
  benchDetail?: DashboardBenchDetail;
  isDetailFetching: boolean;
}

export const BenchDetailModal = memo(function BenchDetailModal({
  modalBenchId,
  closeModal,
  benchDetail,
  isDetailFetching,
}: BenchDetailModalProps) {
  const navigate = useNavigate();
  const { styles } = useInfoModalStyles();

  return (
    <Modal
      width="min(840px, calc(100vw - 32px))"
      open={modalBenchId !== null}
      loading={isDetailFetching && !benchDetail}
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
        ...(benchDetail?.current_booking && dayjs(benchDetail.current_booking.ends_at).isAfter(dayjs())
          ? [
              <NotifyWhenFreeButton
                key="notify"
                benchId={benchDetail.id}
                startsAt={dayjs()}
                // Watch until a couple of hours after the current booking so "ending soon" can fire.
                endsAt={dayjs(benchDetail.current_booking.ends_at).add(2, 'hour')}
              />,
            ]
          : []),
        <Button
          key="book"
          type="primary"
          className={styles.bookButton}
          disabled={!benchDetail}
          onClick={() => {
            if (benchDetail) {
              navigate(`/booking-calendar?action=create&bench_ids=${benchDetail.id}`);
            }
          }}
        >
          Book
        </Button>,
      ]}
    >
      {benchDetail && <InfoModal data={benchDetail} />}
    </Modal>
  );
});

export default BenchDetailModal;
