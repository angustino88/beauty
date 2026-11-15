import { useState } from 'react';
import { Alert, DatePicker, Spin, Table, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useLabsAnalyticsBookedVsUsedRetrieveQuery,
  useLabsAnalyticsEquipmentAvailabilityRetrieveQuery,
} from '@/shared/api/generated/api';
import { MeterStat, StatGrid, StatTile } from '@/shared/components/detail/DetailPrimitives';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { ChartEmpty, RankedList, formatNumber, useChartTheme } from '@/shared/charts';
import { equipmentStatusLabel, equipmentStatusTone } from '@/features/lab-equipment/shared/utils/equipmentStatus';
import { DEFAULT_DURATION, DEFAULT_TIMEZONE } from '../../utils/charts';
import styles from './OperationalAnalyticsCards.module.css';
import type { EquipmentAvailabilityItemRead } from '@/shared/api/generated/api';

const { RangePicker } = DatePicker;
const hours = (value: unknown) => `${formatNumber(Number(value ?? 0))} h`;

export function OperationalAnalyticsCards() {
  const theme = useChartTheme();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs(DEFAULT_DURATION.from_date_time),
    dayjs(DEFAULT_DURATION.to_date_time),
  ]);
  const params = {
    fromDateTime: range[0].tz(DEFAULT_TIMEZONE).startOf('day').format(),
    toDateTime: range[1].tz(DEFAULT_TIMEZONE).endOf('day').format(),
  };
  const bookings = useLabsAnalyticsBookedVsUsedRetrieveQuery(params);
  const availability = useLabsAnalyticsEquipmentAvailabilityRetrieveQuery(params);
  const bookingData = bookings.currentData?.data;
  const equipmentData = availability.currentData?.data;

  return (
    <>
      <div className={styles.period}>
        <Typography.Text strong>Reporting period</Typography.Text>
        <RangePicker
          value={range}
          allowClear={false}
          onChange={(dates) => {
            if (dates?.[0] && dates[1] && !dates[0].isAfter(dates[1])) setRange([dates[0], dates[1]]);
          }}
        />
      </div>
      <div className={styles.grid}>
        <section className={styles.card}>
          <header><h3>Booked vs used hours</h3><span>How much booked bench time was actually used</span></header>
          {bookings.isFetching ? <div className={styles.center}><Spin /></div>
            : bookings.isError ? <Alert type="error" showIcon message="Unable to load booking utilization" action={<a onClick={() => void bookings.refetch()}>Retry</a>} />
              : bookingData ? (
                <>
                  <StatGrid>
                    <MeterStat higherIsBetter label="Used of booked" used={Math.round(bookingData.total_used_hours ?? 0)} total={Math.round(bookingData.total_booked_hours ?? 0)} unit="h"
                      detail={bookingData.used_to_booked_ratio == null ? 'Ratio not available' : `${formatNumber((bookingData.used_to_booked_ratio ?? 0) * 100)}% utilisation`} />
                    <StatTile label="Booked of working time" value={hours(bookingData.total_booked_hours)} detail={`${hours(bookingData.official_working_hours)} official working time`} />
                  </StatGrid>
                  <h4 className={styles.subhead}>Most booked benches</h4>
                  {bookingData.benches?.length ? (
                    <RankedList
                      color={theme.series[0]}
                      unit="h"
                      items={[...bookingData.benches].sort((a, b) => b.booked_hours - a.booked_hours).slice(0, 5)
                        .map((bench) => ({ key: String(bench.bench.id), label: bench.bench.name, value: bench.booked_hours }))}
                    />
                  ) : <ChartEmpty>No bench bookings in this period</ChartEmpty>}
                </>
              ) : <ChartEmpty>No utilization data</ChartEmpty>}
        </section>

        <section className={styles.card}>
          <header><h3>Equipment availability</h3><span>Uptime and outages per tracked device</span></header>
          {availability.isFetching ? <div className={styles.center}><Spin /></div>
            : availability.isError ? <Alert type="error" showIcon message="Unable to load equipment availability" action={<a onClick={() => void availability.refetch()}>Retry</a>} />
              : equipmentData ? (
                <>
                  <StatGrid>
                    <StatTile label="Tracked equipment" value={formatNumber(equipmentData.equipment_count)} />
                    <StatTile label="Average uptime" value={equipmentData.average_uptime_percent == null ? 'N/A' : `${formatNumber(equipmentData.average_uptime_percent)}%`} />
                  </StatGrid>
                  <Table
                    className={styles.table}
                    rowKey={(row) => String(row.equipment.id)}
                    size="small"
                    pagination={{ pageSize: 5, hideOnSinglePage: true }}
                    dataSource={equipmentData.items}
                    columns={[
                      { title: 'Equipment', key: 'equipment', ellipsis: true, render: (_: unknown, row: EquipmentAvailabilityItemRead) => row.equipment.name },
                      {
                        title: 'Uptime', dataIndex: 'uptime_percent', width: 132,
                        render: (value: number) => {
                          const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
                          const color = pct >= 98 ? theme.tone.success : pct >= 95 ? theme.tone.warning : theme.tone.danger;
                          return (
                            <span className={styles.uptime}>
                              <span className={styles.uptimeTrack}><span style={{ width: `${pct}%`, background: color }} /></span>
                              {formatNumber(pct)}%
                            </span>
                          );
                        },
                      },
                      {
                        title: 'Downtime', dataIndex: 'unavailable_hours', align: 'right', width: 110,
                        render: (value: number, row: EquipmentAvailabilityItemRead) => (
                          <span className={styles.downtime}>{hours(value)}<small>{row.outage_count ?? 0} {row.outage_count === 1 ? 'outage' : 'outages'}</small></span>
                        ),
                      },
                      { title: 'Status', dataIndex: 'current_status', width: 140, render: (status: string) => <StatusBadge tone={equipmentStatusTone(status)} label={equipmentStatusLabel(status)} /> },
                    ]}
                  />
                </>
              ) : <ChartEmpty>No availability data</ChartEmpty>}
        </section>
      </div>
    </>
  );
}
