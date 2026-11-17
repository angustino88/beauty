import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker, Segmented, Select } from 'antd';
import { DEFAULT_TIMEZONE } from '../../utils';
import type { ChartDateParams, ChartDurationParams, ChartParams, StatisticUnit } from '../../types';
import styles from './Filters.module.css';

/*
 * Compact filter bars shown on each chart card (and again in the expanded view). Every change
 * applies at once; there is no submit button. The export button lives in the card header.
 * `onExport` is still accepted for older callers and ignored here.
 */

const { RangePicker } = DatePicker;

const today = () => dayjs().tz(DEFAULT_TIMEZONE);

/** Ready-made periods; a custom range can be picked in the same calendar. */
const PERIOD_PRESETS = (): { label: string; value: [Dayjs, Dayjs] }[] => {
  const now = today();
  const lastWeek = now.startOf('isoWeek').subtract(1, 'week');
  const lastMonth = now.startOf('month').subtract(1, 'month');
  return [
    { label: 'Last 7 days', value: [now.subtract(6, 'day'), now] },
    { label: 'Last 30 days', value: [now.subtract(29, 'day'), now] },
    { label: 'Last 90 days', value: [now.subtract(89, 'day'), now] },
    { label: 'Last week', value: [lastWeek, lastWeek.endOf('isoWeek')] },
    { label: 'Last month', value: [lastMonth, lastMonth.endOf('month')] },
    { label: 'This year', value: [now.startOf('year'), now] },
  ];
};

const TOP_OPTIONS = [5, 10, 20, 50].map((value) => ({ value, label: `Top ${value}` }));

interface DurationFilterProps {
  filterParams?: Partial<ChartDurationParams>;
  onChange: (params: ChartDurationParams) => void;
  onExport?: () => void | Promise<void>;
}

interface DateFilterProps {
  filterParams?: Partial<ChartDateParams>;
  onChange: (params: ChartDateParams) => void;
  onExport?: () => void | Promise<void>;
}

interface UnitFilterProps {
  filterParams?: Partial<ChartParams>;
  onChange: (params: { unit: StatisticUnit }) => void;
  onExport?: () => void | Promise<void>;
}

function PeriodPicker({ from, to, onChange }: { from?: string; to?: string; onChange: (from: string, to: string) => void }) {
  const value: [Dayjs, Dayjs] | null = from && to ? [dayjs(from).tz(DEFAULT_TIMEZONE), dayjs(to).tz(DEFAULT_TIMEZONE)] : null;
  return (
    <RangePicker
      size="small"
      className={styles.period}
      value={value}
      allowClear={false}
      format="D MMM YYYY"
      presets={PERIOD_PRESETS()}
      disabledDate={(day) => day.isAfter(today(), 'day')}
      onChange={(range) => {
        if (!range?.[0] || !range[1]) return;
        onChange(
          dayjs.tz(range[0].format('YYYY-MM-DD'), DEFAULT_TIMEZONE).startOf('day').format(),
          dayjs.tz(range[1].format('YYYY-MM-DD'), DEFAULT_TIMEZONE).endOf('day').format(),
        );
      }}
      aria-label="Period"
    />
  );
}

/** Ranking charts: period, how many to show, and which end of the ranking. */
export function OrderRankDateFilter({ filterParams, onChange }: DurationFilterProps) {
  const current: ChartDurationParams = {
    from_date_time: filterParams?.from_date_time ?? '',
    to_date_time: filterParams?.to_date_time ?? '',
    top: filterParams?.top ?? 5,
    order: filterParams?.order ?? 'desc',
  };
  return (
    <div className={styles.bar} role="group" aria-label="Chart filters">
      <PeriodPicker
        from={current.from_date_time}
        to={current.to_date_time}
        onChange={(from_date_time, to_date_time) => onChange({ ...current, from_date_time, to_date_time })}
      />
      <Select
        size="small"
        className={styles.top}
        value={current.top}
        options={TOP_OPTIONS}
        onChange={(top) => onChange({ ...current, top })}
        aria-label="Number of entries"
        popupMatchSelectWidth={false}
      />
      <Segmented
        size="small"
        value={current.order}
        options={[
          { value: 'desc', label: 'Highest' },
          { value: 'asc', label: 'Lowest' },
        ]}
        onChange={(order) => onChange({ ...current, order: order as 'asc' | 'desc' })}
        aria-label="Ranking order"
      />
    </div>
  );
}

/** Period only. */
export function DatePeriodFilter({ filterParams, onChange }: DurationFilterProps) {
  return (
    <div className={styles.bar} role="group" aria-label="Chart filters">
      <PeriodPicker
        from={filterParams?.from_date_time}
        to={filterParams?.to_date_time}
        onChange={(from_date_time, to_date_time) => onChange({ ...filterParams, from_date_time, to_date_time } as ChartDurationParams)}
      />
    </div>
  );
}

/** Bucket size of a time series. */
export function DateUnitFilter({ filterParams, onChange }: UnitFilterProps) {
  return (
    <div className={styles.bar} role="group" aria-label="Chart filters">
      <Segmented
        size="small"
        value={filterParams?.unit || 'day'}
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'quarter', label: 'Quarter' },
          { value: 'year', label: 'Year' },
        ]}
        onChange={(unit) => onChange({ unit: unit as StatisticUnit })}
        aria-label="Group by"
      />
    </div>
  );
}

/** One snapshot day (storage is measured weekly). */
export function DateFilter({ filterParams, onChange }: DateFilterProps) {
  return (
    <div className={styles.bar} role="group" aria-label="Chart filters">
      <span className={styles.label}>Snapshot of</span>
      <DatePicker
        size="small"
        value={filterParams?.log_date ? dayjs(filterParams.log_date) : null}
        allowClear={false}
        format="D MMM YYYY"
        disabledDate={(day) => day.isAfter(today(), 'day')}
        onChange={(day) => day && onChange({ ...filterParams, log_date: day.format('YYYY-MM-DD') } as ChartDateParams)}
        aria-label="Snapshot date"
      />
    </div>
  );
}
