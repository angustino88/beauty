import {
  ClockCircleOutlined,
  DesktopOutlined,
  EditOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Space, Spin, Typography, Button, theme } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { useLazyGetBenchBookingByIdQuery } from '../../api';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { BenchBookingEdit } from '../BenchBookingEdit';

interface EventDetailModalProps {
  eventId?: string | number;
  refetchBooking?: () => void;
  headerColor?: string;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  eventId,
  refetchBooking,
  headerColor,
}) => {
  const { token } = theme.useToken();
  const { username, permissionGroups } = useAuthState();
  const [fetchBooking, { data: booking, isFetching }] = useLazyGetBenchBookingByIdQuery();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    if (eventId) {
      void fetchBooking(eventId);
    }
  }, [eventId, fetchBooking]);

  const hasPermission = useMemo(
    () =>
      !!booking &&
      (username === 'adminlab' ||
        username === booking.creator?.username ||
        !!permissionGroups['lab-coordinator']),
    [booking, username, permissionGroups],
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
  const benchName = booking?.bench?.name || 'Unknown Bench';
  const computerName = booking?.computer?.computer_name || booking?.bench?.uid;

  return (
    <>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {booking ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 10px 6px 10px',
                borderBottom: '1px solid var(--lm-border)',
                borderRadius: '8px 8px 0 0',
                backgroundColor: headerColor || token.colorPrimaryBg,
                borderColor: token.colorPrimaryBorder,
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
                <LockOutlined /> {hasPermission ? booking.booking_code : '••••••••••'}
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--lm-text-secondary)', fontSize: '12px' }}>
                <ClockCircleOutlined /> {formatBookingDuration()}
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--lm-text-secondary)', fontSize: '12px' }}>
                <DesktopOutlined />{' '}
                {`${benchName}${computerName ? ` (${computerName})` : ''}`}
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
