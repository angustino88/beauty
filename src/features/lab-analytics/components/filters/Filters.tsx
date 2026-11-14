import dayjs from 'dayjs';
import { DEFAULT_TIMEZONE, getNearestLastWeekday, PERIOD } from '../../utils';
import { ChartFilter } from './FilterTemplate';
import { DateFilterItem, DateSelectFilterItem, DateUnitFilterItem, OrderFilterItem, RankFilterItem } from './FilterItem';
import type { ChartDateParams, ChartDurationParams, ChartParams, StatisticUnit } from '../../types';

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

export function OrderRankDateFilter({ filterParams, onChange, onExport }: DurationFilterProps) {
  const initialValues = {
    order: String(filterParams?.order || 'desc'),
    top: String(filterParams?.top || '5'),
    period:
      filterParams?.from_date_time && filterParams?.to_date_time
        ? `${dayjs(filterParams.from_date_time).format('YYYY-MM-DD')} - ${dayjs(filterParams.to_date_time).format('YYYY-MM-DD')}`
        : PERIOD.LAST_WEEK,
  };

  return (
    <ChartFilter
      initialValues={initialValues}
      handleFinish={(values) => {
        const period = String(values.period || PERIOD.LAST_WEEK).split(' - ');
        const top = Number(values.top);
        if (!Number.isSafeInteger(top) || top < 1) return;
        onChange({
          top,
          order: values.order as 'asc' | 'desc',
          from_date_time: dayjs.tz(period[0], DEFAULT_TIMEZONE).startOf('day').format(),
          to_date_time: dayjs.tz(period[1], DEFAULT_TIMEZONE).endOf('day').format(),
        });
      }}
      onExport={onExport}
    >
      <OrderFilterItem colSpan={8} />
      <RankFilterItem colSpan={6} />
      <DateSelectFilterItem colSpan={8} />
    </ChartFilter>
  );
}

export function DatePeriodFilter({ filterParams, onChange, onExport }: DurationFilterProps) {
  const initialValues = {
    period:
      filterParams?.from_date_time && filterParams?.to_date_time
        ? `${dayjs(filterParams.from_date_time).format('YYYY-MM-DD')} - ${dayjs(filterParams.to_date_time).format('YYYY-MM-DD')}`
        : PERIOD.LAST_WEEK,
  };

  return (
    <ChartFilter
      initialValues={initialValues}
      handleFinish={(values) => {
        const period = String(values.period || PERIOD.LAST_WEEK).split(' - ');
        onChange({
          from_date_time: dayjs.tz(period[0], DEFAULT_TIMEZONE).startOf('day').format(),
          to_date_time: dayjs.tz(period[1], DEFAULT_TIMEZONE).endOf('day').format(),
        });
      }}
      onExport={onExport}
    >
      <DateSelectFilterItem colSpan={12} />
    </ChartFilter>
  );
}

export function DateUnitFilter({ filterParams, onChange, onExport }: UnitFilterProps) {
  return (
    <ChartFilter
      initialValues={{ unit: String(filterParams?.unit || 'day') }}
      handleFinish={(values) => onChange({ unit: (values.unit as StatisticUnit) || 'day' })}
      onExport={onExport}
    >
      <DateUnitFilterItem colSpan={3} />
    </ChartFilter>
  );
}

export function DateFilter({ filterParams, onChange, onExport }: DateFilterProps) {
  const nearestTuesday = getNearestLastWeekday(2);
  return (
    <ChartFilter
      initialValues={{
        log_date: filterParams?.log_date ? dayjs(filterParams.log_date) : nearestTuesday,
      }}
      handleFinish={(values) => onChange({ log_date: dayjs(values.log_date as dayjs.Dayjs).format('YYYY-MM-DD'), top: filterParams?.top })}
      onExport={onExport}
    >
      <DateFilterItem colSpan={6} />
    </ChartFilter>
  );
}
