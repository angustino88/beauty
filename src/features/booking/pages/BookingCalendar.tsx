import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookingFilter } from '../components/BookingFilter';
import { Calendar } from '../components/calendar/Calendar';
import { BenchBookingCreate } from '../components/BenchBookingCreate';
import { useBookingCalendarEvents } from '../hooks/useBookingCalendarEvents';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { benchSelectionStorageKey, readBenchSelection, writeBenchSelection } from '../utils/benchColors';
import styles from './BookingCalendar.module.css';

const parseBenchIds = (searchParams: URLSearchParams): number[] => {
  const param = searchParams.get('bench_ids');
  if (!param) return [];
  return param
    .split(',')
    .map((item) => parseInt(item, 10))
    .filter((num) => !Number.isNaN(num));
};

/** `?action=create&starts_at=&ends_at=` → the time to prefill, when valid. */
const parseCreateInterval = (searchParams: URLSearchParams): { starts_at: Dayjs; ends_at: Dayjs } | undefined => {
  const start = searchParams.get('starts_at');
  const end = searchParams.get('ends_at');
  if (searchParams.get('action') !== 'create' || !start || !end) return undefined;
  const startsAt = dayjs(start);
  const endsAt = dayjs(end);
  return startsAt.isValid() && endsAt.isValid() && endsAt.isAfter(startsAt)
    ? { starts_at: startsAt, ends_at: endsAt }
    : undefined;
};

/** `?booking_id=&date=` (Dashboard "Up next") → the booking to open and the day it is on. */
const parseFocus = (searchParams: URLSearchParams): { bookingId: string; date: Date } | undefined => {
  const bookingId = searchParams.get('booking_id');
  const date = dayjs(searchParams.get('date'));
  return bookingId && date.isValid() ? { bookingId, date: date.toDate() } : undefined;
};

const BookingCalendar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formInstance] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(
    () => searchParams.get('action') === 'create',
  );
  const [createTimeInterval, setCreateTimeInterval] = useState<
    { starts_at?: Dayjs; ends_at?: Dayjs } | undefined
  >(() => parseCreateInterval(searchParams));

  // Alert links ("Book now") open the form with bench and free time prefilled, also when the
  // calendar is already open. The one-shot parameters are then removed so a reload does not reopen it.
  const createLinkKey = searchParams.get('action') === 'create' ? searchParams.toString() : null;
  const [handledCreateLink, setHandledCreateLink] = useState(createLinkKey);
  if (createLinkKey && createLinkKey !== handledCreateLink) {
    setHandledCreateLink(createLinkKey);
    setCreateTimeInterval(parseCreateInterval(searchParams));
    setIsModalVisible(true);
  }

  const clearCreateParams = () =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        ['action', 'starts_at', 'ends_at'].forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
  const visibleDateRangeRef = useRef<{ start: string; end: string } | null>(null);
  // Read once: the calendar opens on this booking's day with its details showing.
  const [focus] = useState(() => parseFocus(searchParams));

  const { bookingEvents, isFetching, fetchEvents } = useBookingCalendarEvents();
  const { id: myUserId, username } = useAuthState();
  const storageKey = benchSelectionStorageKey(myUserId ?? username);


  useEffect(() => {
    const benchIds = parseBenchIds(searchParams);
    formInstance.setFieldsValue({ bench_ids: benchIds });
    fetchEvents(benchIds, visibleDateRangeRef.current ?? undefined);
  }, [searchParams, formInstance, fetchEvents]);

  const updateBenchParams = (benchIds?: number[]) => {
    writeBenchSelection(storageKey, benchIds ?? []);
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

  // A link with bench_ids wins; otherwise reopen the benches this person had selected last time.
  useEffect(() => {
    if (searchParams.has('bench_ids')) return;
    const remembered = readBenchSelection(storageKey);
    if (remembered.length) updateBenchParams(remembered);
    // Only on first load for this person.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

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
    clearCreateParams();

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
    clearCreateParams();
  };

  const refetchData = () => {
    const benchIds: number[] = formInstance.getFieldValue('bench_ids') || [];
    fetchEvents(benchIds, visibleDateRangeRef.current ?? undefined);
  };

  return (
    <Card className={styles.calendarCard}>
      <PageHeader
        title="Booking Calendar"
        wrapControls
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
        initialDate={focus?.date}
        focusEventId={focus?.bookingId}
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
