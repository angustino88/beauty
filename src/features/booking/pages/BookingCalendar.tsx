import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookingFilter } from '../components/BookingFilter';
import { Calendar } from '../components/calendar/Calendar';
import { BenchBookingCreate } from '../components/BenchBookingCreate';
import { useBookingCalendarEvents } from '../hooks/useBookingCalendarEvents';
import { PageHeader } from '@/components/layout/PageHeader';
import styles from './BookingCalendar.module.css';

const parseBenchIds = (searchParams: URLSearchParams): number[] => {
  const param = searchParams.get('bench_ids');
  if (!param) return [];
  return param
    .split(',')
    .map((item) => parseInt(item, 10))
    .filter((num) => !Number.isNaN(num));
};

const BookingCalendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formInstance] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(
    () => searchParams.get('action') === 'create',
  );
  const [createTimeInterval, setCreateTimeInterval] = useState<
    { starts_at?: Dayjs; ends_at?: Dayjs } | undefined
  >(undefined);
  const visibleDateRangeRef = useRef<{ start: string; end: string } | null>(null);

  const { bookingEvents, isFetching, fetchEvents } = useBookingCalendarEvents();

  useEffect(() => {
    const benchIds = parseBenchIds(searchParams);
    if (benchIds.length > 0) {
      formInstance.setFieldsValue({ bench_ids: benchIds });
      fetchEvents(benchIds, visibleDateRangeRef.current ?? undefined);
    }
  }, [searchParams, formInstance, fetchEvents]);

  const updateBenchParams = (benchIds?: number[]) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!benchIds || benchIds.length === 0) {
          next.delete('bench_ids');
        } else {
          next.set('bench_ids', benchIds.join(','));
        }
        return next;
      },
      { replace: true },
    );
  };

  const handleFilterFinish = (values: { bench_ids?: number[] }) => {
    const benchIds = values.bench_ids;
    updateBenchParams(benchIds);
    fetchEvents(benchIds ?? [], visibleDateRangeRef.current ?? undefined);
  };

  const handleDatesSet = (range: { start: string; end: string }) => {
    visibleDateRangeRef.current = range;
    const benchIds: number[] = formInstance.getFieldValue('bench_ids') || [];
    if (benchIds.length > 0) {
      fetchEvents(benchIds, range);
    }
  };

  const handleSelectTimeInterval = (interval?: {
    starts_at?: Dayjs;
    ends_at?: Dayjs;
  }) => {
    setCreateTimeInterval(interval);
    setIsModalVisible(true);
  };

  const handleCreateModalClose = (selectedBench: number) => {
    setIsModalVisible(false);
    setCreateTimeInterval(undefined);

    const currentBenches: number[] = formInstance.getFieldValue('bench_ids') || [];
    if (!currentBenches.includes(selectedBench) && selectedBench !== 0) {
      const nextBenches = [...currentBenches, selectedBench];
      formInstance.setFieldsValue({ bench_ids: nextBenches });
      updateBenchParams(nextBenches);
      fetchEvents(nextBenches, visibleDateRangeRef.current ?? undefined);
      return;
    }

    refetchData();
  };

  const handleCreateModalCancel = () => {
    setIsModalVisible(false);
    setCreateTimeInterval(undefined);
  };

  const refetchData = () => {
    const benchIds: number[] = formInstance.getFieldValue('bench_ids') || [];
    fetchEvents(benchIds, visibleDateRangeRef.current ?? undefined);
  };

  return (
    <Card className={styles.calendarCard}>
      <PageHeader
        title="Booking Calendar"
        controls={
          <div className={styles.headerControls}>
            <span className={styles.filterLabel}>Benches</span>
            <div className={styles.filterControl}>
              <BookingFilter form={formInstance} name="bench_ids" onFinish={handleFilterFinish} />
            </div>
            {isFetching && <Spin size="small" />}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCreateTimeInterval(undefined);
                setIsModalVisible(true);
              }}
            >
              New Booking
            </Button>
          </div>
        }
      />

      <Calendar
        events={bookingEvents}
        onSelect={handleSelectTimeInterval}
        refetchBooking={refetchData}
        onDatesSet={handleDatesSet}
      />

      {isModalVisible && (
        <BenchBookingCreate
          modalProps={{ open: isModalVisible, onCancel: handleCreateModalCancel }}
          closeModal={handleCreateModalClose}
          timeInterval={createTimeInterval}
          refetchBooking={refetchData}
        />
      )}
    </Card>
  );
};

export default BookingCalendar;
