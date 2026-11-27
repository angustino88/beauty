// src/features/dashboard/components/modals/BenchDetailModal.tsx
import { memo } from 'react';
import { Button, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { FollowBookingButton } from '@/features/booking/slot-alerts/FollowBookingButton';
import { useIsOwnBooking } from '@/features/booking/slot-alerts/useIsOwnBooking';
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
  const current = benchDetail?.current_booking;
  const isCurrentRunning = !!current && dayjs(current.ends_at).isAfter(dayjs());
  const { isOwn, isChecking } = useIsOwnBooking(
    benchDetail && current && isCurrentRunning
      ? { id: current.id, benchId: benchDetail.id, startsAt: current.starts_at }
      : null,
  );

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
        // Someone else is using the bench: offer one alert when their booking ends.
        ...(current && isCurrentRunning && !isOwn && !isChecking
          ? [<FollowBookingButton key="follow" bookingId={current.id} />]
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
