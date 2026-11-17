import {
  AutoComplete,
  Col,
  DatePicker,
  Form,
  type FormInstance,
  type FormProps,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
} from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { filterResourceOption } from '@/components/inputs/ResourceOption';
import type { IBenchBookingFormValues } from '../types';
import { useGetBenchBookingsQuery, useGetBookingBenchChoicesQuery, useGetProjectOptionsQuery } from '../api';
import { toBenchChoiceOption } from '../utils/benchChoiceOption';
import { useRecommendedSlots } from '../hooks/useRecommendedSlots';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { DATETIMEFORMAT, TIME_FORMAT, disabledRangeTime } from '@/shared/utils/booking';
import styles from './BookingForm.module.css';

type BookingFormProps = {
  formProps: FormProps<IBenchBookingFormValues>;
  form: FormInstance<IBenchBookingFormValues>;
};

const MAX_BOOKING_REASON_SUGGESTIONS = 10;

const formatBookingDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;

  const hours = minutes / 60;
  if (hours < 24) return `${hours % 1 === 0 ? hours : hours.toFixed(1)} hour${hours === 1 ? '' : 's'}`;

  const days = hours / 24;
  return `${days % 1 === 0 ? days : days.toFixed(1)} day${days === 1 ? '' : 's'}`;
};

const uniqueReasons = (reasons: string[]) =>
  reasons
    .map((reason) => reason.trim())
    .filter(Boolean)
    .filter(
      (reason, index, candidates) =>
        candidates.findIndex((candidate) => candidate.toLowerCase() === reason.toLowerCase()) === index,
    )
    .slice(0, MAX_BOOKING_REASON_SUGGESTIONS);

export const BookingForm: React.FC<BookingFormProps> = ({ form, formProps }) => {
  const { id: myUserId, username: myUsername } = useAuthState();
  // The bench of the booking being edited stays selectable even when it is no longer in service.
  const initialBenchId = (formProps.initialValues as Partial<IBenchBookingFormValues> | undefined)?.bench_id;
  const { data: benchChoices } = useGetBookingBenchChoicesQuery({ includeId: initialBenchId ?? null, hasComputing: true });
  const benchOptions = useMemo(() => (benchChoices ?? []).map((bench) => toBenchChoiceOption(bench)), [benchChoices]);
  const { data: projectOptions } = useGetProjectOptionsQuery();
  const sortedProjectOptions = [...(projectOptions ?? [])].sort((first, second) =>
    String(first.label).localeCompare(String(second.label), undefined, { sensitivity: 'base' }),
  );
  const { data: bookingHistory } = useGetBenchBookingsQuery(
    {
      view_side: 'my_booking',
      creator: myUsername,
      page: 1,
      page_size: 100,
    },
    { skip: !myUsername },
  );

  const bookingReasonStorageKey = `labmango.booking-reasons.${myUserId ?? myUsername}`;

  const currentStatus = Form.useWatch('status', form);
  let statusOptions: { label: string; value: string }[] = [];

  if (currentStatus) {
    if (currentStatus === 'reserved') {
      statusOptions = [
        { label: 'Reserved', value: 'reserved' },
        { label: 'Cancelled', value: 'cancelled' },
      ];
    } else if (currentStatus === 'in_progress') {
      statusOptions = [
        { label: 'In progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ];
    } else if (currentStatus === 'completed') {
      statusOptions = [{ label: 'Completed', value: 'completed' }];
    } else if (currentStatus === 'cancelled') {
      statusOptions = [{ label: 'Cancelled', value: 'cancelled' }];
    } else if (currentStatus === 'expired') {
      statusOptions = [{ label: 'Expired', value: 'expired' }];
    }
  }

  const [selectFromDate, setSelectFromDate] = useState<dayjs.Dayjs | null>(null);
  const [reasonMenuOpen, setReasonMenuOpen] = useState(false);
  const [reasonSuggestions, setReasonSuggestions] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(bookingReasonStorageKey) || '[]');
      return Array.isArray(stored)
        ? stored
            .filter((reason): reason is string => typeof reason === 'string')
            .slice(0, MAX_BOOKING_REASON_SUGGESTIONS)
        : [];
    } catch {
      return [];
    }
  });

  const serverReasons =
    bookingHistory?.data
      ?.filter(
        (booking) => myUserId != null && booking.creator?.id === myUserId,
      )
      .map((booking) => booking.reason)
      .filter((reason): reason is string => typeof reason === 'string' && reason.trim().length > 0) ??
    [];
  const suggestedReasons = uniqueReasons([...serverReasons, ...reasonSuggestions]);

  const benchId = Form.useWatch('bench_id', form) ?? undefined;
  const startsAt = Form.useWatch('starts_at', form);
  const endsAt = Form.useWatch('ends_at', form);

  const startsAtDayjs = dayjs.isDayjs(startsAt) ? startsAt : startsAt ? dayjs(startsAt) : null;
  const endsAtDayjs = dayjs.isDayjs(endsAt) ? endsAt : endsAt ? dayjs(endsAt) : null;

  const bookingDuration =
    startsAtDayjs && endsAtDayjs
      ? Math.max(0, endsAtDayjs.startOf('minute').diff(startsAtDayjs.startOf('minute'), 'minute'))
      : null;
  const selectedSuggestionStart = startsAtDayjs ? startsAtDayjs.valueOf() : null;
  const {
    recommendedSlots,
    loading: slotsLoading,
    hasBlockingBookings,
  } = useRecommendedSlots(
    benchId ?? undefined,
    bookingDuration ?? 30,
    startsAtDayjs ?? undefined,
  );


  const checkDatetime = () => {
    const start = form.getFieldValue('starts_at');
    const end = form.getFieldValue('ends_at');
    const startDayjs = dayjs.isDayjs(start) ? start : start ? dayjs(start) : null;
    const endDayjs = dayjs.isDayjs(end) ? end : end ? dayjs(end) : null;

    setSelectFromDate(startDayjs);
    if (startDayjs && endDayjs) {
      const fromMinute = startDayjs.startOf('minute');
      const toMinute = endDayjs.startOf('minute');
      if (fromMinute.isAfter(toMinute) || toMinute.diff(fromMinute, 'minute') < 10) {
        form.setFields([
          { name: 'ends_at', errors: ['To Datetime must be at least 10min after From Datetime!'] },
        ]);
      } else {
        form.setFields([{ name: 'ends_at', errors: [] }]);
      }
    } else {
      form.setFields([{ name: 'ends_at', errors: [] }]);
    }
  };

  const rememberBookingReason = (reasonValue?: string) => {
    const reason = reasonValue?.trim();
    if (!reason) return;

    const updatedSuggestions = uniqueReasons([reason, ...reasonSuggestions]);
    setReasonSuggestions(updatedSuggestions);
    localStorage.setItem(bookingReasonStorageKey, JSON.stringify(updatedSuggestions));
  };

  return (
    <Form
      className={styles.bookingForm}
      layout="vertical"
      form={form}
      {...formProps}
      onFinish={(values) => {
        const reasonVal = values.reason;
        rememberBookingReason(reasonVal);
        const resolvedValues: IBenchBookingFormValues = {
          bench_id: values.bench_id,
          project_id: values.project_id,
          starts_at: values.starts_at,
          ends_at: values.ends_at,
          reason: reasonVal,
          status: values.status,
        };
        return formProps.onFinish?.(resolvedValues);
      }}
    >
      <section className={styles.section}>
        <div className={styles.sectionBody}>
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Bench" name="bench_id" rules={[{ required: true, message: 'Please select a bench' }]}>
                <Select
                  showSearch
                  placeholder="Search by bench SKU or computing name"
                  options={benchOptions}
                  optionLabelProp="selectedLabel"
                  filterOption={filterResourceOption}
                  disabled={currentStatus === 'in_progress'}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Project" name="project_id" rules={[{ required: true, message: 'Please select a project' }]}>
                <Select
                  showSearch
                  options={sortedProjectOptions}
                  placeholder="Select a project"
                  filterOption={(inputValue, option) =>
                    option?.label.toLowerCase().includes(inputValue.toLowerCase()) || false
                  }
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Booking reason" name="reason" rules={[{ required: true, message: 'Please enter a reason' }]}>
                <AutoComplete
                  className={styles.reasonInput}
                  open={reasonMenuOpen && suggestedReasons.length > 0}
                  options={
                    suggestedReasons.length > 0
                      ? [
                          {
                            label: 'Your recent reasons',
                            options: suggestedReasons.map((reason) => ({
                              value: reason,
                              label: (
                                <div className={styles.reasonOption}>
                                  <ClockCircleOutlined />
                                  <span>{reason}</span>
                                </div>
                              ),
                            })),
                          },
                        ]
                      : []
                  }
                  filterOption={(inputValue, option) => {
                    const value = (option as { value?: string } | undefined)?.value;
                    return value?.toLowerCase().includes(inputValue.toLowerCase()) || false;
                  }}
                  onFocus={() => setReasonMenuOpen(true)}
                  onSearch={() => setReasonMenuOpen(true)}
                  onSelect={(val) => {
                    setReasonMenuOpen(false);
                    form.setFieldValue('reason', val);
                  }}
                  onBlur={() => setReasonMenuOpen(false)}
                  onChange={(val) => {
                    form.setFieldValue('reason', val);
                  }}
                >
                  <Input showCount placeholder="Select or enter a booking reason" maxLength={32} />
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionBody}>
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item label="From Datetime" name="starts_at" rules={[{ required: true, message: 'Please select start time' }]}>
                <DatePicker
                  placeholder={DATETIMEFORMAT}
                  showTime={{ format: TIME_FORMAT, minuteStep: 5 }}
                  style={{ width: '100%' }}
                  onChange={() => checkDatetime()}
                  format={DATETIMEFORMAT}
                  disabledTime={(date) => disabledRangeTime(date)}
                  minDate={dayjs()}
                  disabled={currentStatus === 'in_progress'}
                  needConfirm={false}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="To Datetime" name="ends_at" rules={[{ required: true, message: 'Please select end time' }]}>
                <DatePicker
                  placeholder={DATETIMEFORMAT}
                  showTime={{ format: TIME_FORMAT, minuteStep: 5 }}
                  style={{ width: '100%' }}
                  minDate={selectFromDate ?? dayjs()}
                  disabledTime={(date) =>
                    disabledRangeTime(
                      date,
                      form.getFieldValue('starts_at'),
                    )
                  }
                  value={
                    currentStatus === 'completed'
                      ? (() => {
                          const now = dayjs();
                          form.setFieldValue('ends_at', now);
                          return now;
                        })()
                      : undefined
                  }
                  onChange={() => checkDatetime()}
                  disabled={currentStatus === 'completed'}
                  format={DATETIMEFORMAT}
                  needConfirm={false}
                />
              </Form.Item>
            </Col>
          </Row>

          {bookingDuration !== null && (
            <div className={styles.durationNotice}>
              <ClockCircleOutlined />
              <strong>Booking duration: {formatBookingDuration(bookingDuration)}</strong>
            </div>
          )}

          {benchId != null && (
            <div className={styles.suggestions}>
              <span className={styles.suggestionLabel}>Suggested times</span>
              {slotsLoading ? (
                <Skeleton.Button active size="small" style={{ width: 136 }} />
              ) : hasBlockingBookings && recommendedSlots.length === 0 ? (
                <Tag color="pink">No suitable time left today</Tag>
              ) : (
                <Space size={[4, 4]} wrap>
                  {recommendedSlots.map((slot) => {
                    const isSelected = selectedSuggestionStart === slot.start.valueOf();
                    const timeRange = `${slot.start.format('HH:mm')} - ${slot.end.format('HH:mm')}`;

                    return (
                      <Tooltip key={slot.start.toISOString()} title={`Book ${timeRange}`}>
                        <button
                          type="button"
                          className={`${styles.suggestionButton} ${isSelected ? styles.suggestionButtonSelected : ''}`}
                          aria-pressed={isSelected}
                          onClick={() => {
                            form.setFieldValue('starts_at', slot.start);
                            form.setFieldValue('ends_at', slot.end);
                            checkDatetime();
                          }}
                        >
                          {timeRange}
                        </button>
                      </Tooltip>
                    );
                  })}
                </Space>
              )}
            </div>
          )}
        </div>
      </section>

      <Form.Item
        label="Status"
        name="status"
        hidden={!currentStatus}
        rules={[{ required: !!currentStatus }]}
      >
        <Select options={statusOptions} />
      </Form.Item>
    </Form>
  );
};
