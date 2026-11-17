import {
  ClockCircleOutlined,
  DesktopOutlined,
  EditOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Space, Spin, Typography, Button } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { useGetBookingBenchChoicesQuery, useLazyGetBenchBookingByIdQuery } from '../../api';
import { formatBenchLabel } from '../../utils/benchChoiceOption';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { BenchBookingEdit } from '../BenchBookingEdit';
import type { BenchBookingItem } from '../../types';

interface EventDetailModalProps {
  eventId?: string | number;
  refetchBooking?: () => void;
  /**
   * The booking as the calendar list returned it. Other people's bookings are readable only through that list
   * (the detail endpoint is creator-only), so it is shown without a second request.
   */
  listedBooking?: BenchBookingItem;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  eventId,
  refetchBooking,
  listedBooking,
}) => {
  const { id: myUserId, permissionGroups } = useAuthState();
  const [fetchBooking, { data: fetchedBooking, isFetching }] = useLazyGetBenchBookingByIdQuery();
  const booking = listedBooking ?? fetchedBooking;
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    if (eventId && !listedBooking) {
      void fetchBooking(eventId);
    }
  }, [eventId, listedBooking, fetchBooking]);

  const hasPermission = useMemo(
    () =>
      !!booking &&
      ((myUserId != null && booking.creator?.id === myUserId) ||
        !!permissionGroups['admin'] ||
        !!permissionGroups['lab-coordinator']),
    [booking, myUserId, permissionGroups],
  );

  const formatBookingDuration = () => {
    const from = dayjs(booking?.starts_at);
    const to = dayjs(booking?.ends_at);
    return from.isSame(to, 'day')
      ? `${from.format('dddd, MMM D, YYYY h:mm A')} - ${to.format('h:mm A')}`
      : `${from.format('dddd, MMM D, YYYY h:mm A')} - ${to.format('dddd, MMM D, YYYY h:mm A')}`;
  };

  const projectName = booking?.project?.name || 'Unknown project';
  const reason = booking?.reason || '';
  // The list does not carry the SKU or computers of a bench; the cached bench choices do (same list as the filter).
  const { data: benchChoices } = useGetBookingBenchChoicesQuery();
  const choice = benchChoices?.find((bench) => bench.id === booking?.bench?.id);
  const benchLabel = formatBenchLabel(
    booking?.bench?.sku || choice?.sku,
    booking?.bench?.name || choice?.name,
    booking?.computer?.computer_name
      ? [booking.computer.computer_name]
      : (choice?.computers ?? []).map((computer) => computer.name || computer.sku),
  ) || 'Unknown Bench';
  // Same colour rule as the calendar event: own booking = green, others' = orange.
  const isMine = !!booking && myUserId != null && booking.creator?.id === myUserId;

  return (
    <>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {booking ? (
          <>
            <div
              className={isMine ? 'lm-tone-mine' : 'lm-tone-other'}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 10px 6px 10px',
                borderBottom: '1px solid var(--lm-border)',
                borderRadius: '8px 8px 0 0',
                backgroundColor: 'var(--lm-booking-bg)',
                borderLeft: '4px solid var(--lm-booking-solid)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography.Text strong style={{ fontSize: '14px', color: 'var(--lm-text)', margin: 0 }}>
                {projectName}{reason ? ` - ${reason}` : ''}
              </Typography.Text>
              {hasPermission &&
                !['completed', 'expired', 'cancelled', 'done'].includes(booking.status || '') && (
                <Button
                  size="small"
                  type="text"
                  onClick={() => setIsEditModalVisible(true)}
                  icon={<EditOutlined />}
                  style={{ color: 'var(--lm-text-tertiary)' }}
                />
              )}
            </div>
            <Space direction="vertical" style={{ padding: '0px 10px 6px' }}>
              <Typography.Text italic style={{ color: 'var(--lm-text-secondary)', fontSize: '12px' }}>
                <LockOutlined /> {hasPermission && booking.booking_code ? booking.booking_code : '••••••••••'}
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--lm-text-secondary)', fontSize: '12px' }}>
                <ClockCircleOutlined /> {formatBookingDuration()}
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--lm-text-secondary)', fontSize: '12px' }}>
                <DesktopOutlined />{' '}
                {benchLabel}
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--lm-text-secondary)', fontSize: '12px' }}>
                <UserOutlined /> {booking.creator?.display_name || booking.creator?.username}
              </Typography.Text>
            </Space>
          </>
        ) : (
          <Space style={{ display: 'flex', justifyContent: 'center', padding: 20, width: 200 }}>
            {isFetching ? <Spin /> : <Typography.Text>No data found.</Typography.Text>}
          </Space>
        )}
      </Space>
      {isEditModalVisible && (
        <BenchBookingEdit
          visible={isEditModalVisible}
          eventId={eventId}
          refetchBooking={refetchBooking}
          onClose={() => setIsEditModalVisible(false)}
        />
      )}
    </>
  );
};
