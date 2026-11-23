import { Button, Col, Modal, Row } from 'antd';
import { InlineAlert } from '@/shared/notifications';
import { useMemo, useState } from 'react';
import { ExportOutlined } from '@ant-design/icons';
import { MiniBars, StatTriplet, TrendChip, useChartTheme } from '@/shared/charts';
import { Skeleton } from '@/components/ui/skeleton';
import styles from './Statistics.module.css';
import {
  useGetBookingCountStatisticsQuery,
  useGetBookingTrendSeriesQuery,
  useGetLabCountStatisticsQuery,
  useGetLabCountTrendSeriesQuery,
  useGetLabVisitStatisticsQuery,
  useGetLabVisitTrendSeriesQuery,
  useGetUserCountStatisticsQuery,
  useGetUserCountTrendSeriesQuery,
} from '../api/statisticsEndpoints';
import type { StatisticUnit } from '../types';
import { analyticsColumnIndex } from '../utils/charts';
import { exportRowsToExcel } from '../utils/export';
import { StatisticsChart } from './charts';
import { DateUnitFilter } from './filters';

type StatKey = 'labVisitChart' | 'bookingCountChart' | 'userCountChart' | 'labCountChart';

export function Statistics() {
  const chartTheme = useChartTheme();
  const [modalOpen, setModalOpen] = useState<StatKey | ''>('');
  const [unitByKey, setUnitByKey] = useState<Record<StatKey, StatisticUnit>>({
    labVisitChart: 'day',
    bookingCountChart: 'day',
    userCountChart: 'day',
    labCountChart: 'day',
  });

  const { data: labVisits, isFetching: labVisitLoading, isError: labVisitError, refetch: retryLabVisits } = useGetLabVisitStatisticsQuery();
  const { data: bookingCount, isFetching: bookingCountLoading, isError: bookingCountError, refetch: retryBookings } = useGetBookingCountStatisticsQuery();
  const { data: userCount, isFetching: userCountLoading, isError: userCountError, refetch: retryUsers } = useGetUserCountStatisticsQuery();
  const { data: labCount, isFetching: labCountLoading, isError: labCountError, refetch: retryLabs } = useGetLabCountStatisticsQuery();

  const { data: labVisitSeries = [], isError: labVisitSeriesError, refetch: retryLabVisitSeries } = useGetLabVisitTrendSeriesQuery({ unit: unitByKey.labVisitChart });
  const { data: bookingSeries = [], isError: bookingSeriesError, refetch: retryBookingSeries } = useGetBookingTrendSeriesQuery({ unit: unitByKey.bookingCountChart });
  const { data: userSeries = [], isError: userSeriesError, refetch: retryUserSeries } = useGetUserCountTrendSeriesQuery({ unit: unitByKey.userCountChart });
  const { data: labSeries = [], isError: labSeriesError, refetch: retryLabSeries } = useGetLabCountTrendSeriesQuery({ unit: unitByKey.labCountChart });

  const statisticsMap = useMemo(
    () => [
      {
        statistics: labVisits,
        title: 'Weekly Visitors',
        key: 'labVisitChart' as const,
        unit: 'visits',
        colorIndex: 0,
        loading: labVisitLoading,
        error: labVisitError || labVisitSeriesError,
        retry: () => { void retryLabVisits(); void retryLabVisitSeries(); },
        data: labVisitSeries,
      },
      {
        statistics: bookingCount,
        title: 'Weekly Bookings',
        key: 'bookingCountChart' as const,
        unit: 'bookings',
        colorIndex: 1,
        loading: bookingCountLoading,
        error: bookingCountError || bookingSeriesError,
        retry: () => { void retryBookings(); void retryBookingSeries(); },
        data: bookingSeries,
      },
      {
        statistics: userCount,
        title: 'Total Users',
        key: 'userCountChart' as const,
        unit: 'users',
        colorIndex: 2,
        loading: userCountLoading,
        error: userCountError || userSeriesError,
        retry: () => { void retryUsers(); void retryUserSeries(); },
        data: userSeries,
      },
      {
        statistics: labCount,
        title: 'Total Labs',
        key: 'labCountChart' as const,
        unit: 'labs',
        colorIndex: 4,
        loading: labCountLoading,
        error: labCountError || labSeriesError,
        retry: () => { void retryLabs(); void retryLabSeries(); },
        data: labSeries,
      },
    ],
    [
      labVisits, bookingCount, userCount, labCount,
      labVisitLoading, bookingCountLoading, userCountLoading, labCountLoading,
      labVisitSeries, bookingSeries, userSeries, labSeries,
      labVisitError, bookingCountError, userCountError, labCountError,
      labVisitSeriesError, bookingSeriesError, userSeriesError, labSeriesError,
      retryLabVisits, retryBookings, retryUsers, retryLabs,
      retryLabVisitSeries, retryBookingSeries, retryUserSeries, retryLabSeries,
    ],
  );

  return (
    <Row gutter={[16, 16]}>
      {statisticsMap.map((entry) => {
        const color = chartTheme.series[entry.colorIndex];
        const values = entry.data.map((point) => Number(point.count));
        return (
          <Col xs={24} sm={12} xl={6} key={entry.key}>
            <button type="button" className={styles.kpi} onClick={() => setModalOpen(entry.key)} aria-label={`Open ${entry.title} trend`}>
              <span className={styles.kpiTitle}>{entry.title}</span>
              {entry.loading ? <Skeleton className="tw:my-1 tw:h-8 tw:w-24" /> : (
                <strong className={styles.kpiValue}>{entry.statistics?.count?.toLocaleString() ?? '—'}</strong>
              )}
              <span className={styles.kpiCompare}>Compared to last week</span>
              {entry.error ? <span className={styles.kpiError}>Unable to load metrics</span> : (
                <>
                  <div className={styles.kpiChartRow}>
                    {values.length > 1 ? <MiniBars values={values} color={color} /> : <span />}
                    <TrendChip value={entry.statistics?.trend} />
                  </div>
                  {values.length > 1 && <StatTriplet values={values} />}
                </>
              )}
            </button>
            <Modal
              width="min(1080px, calc(100vw - 32px))"
              key={entry.key}
              title={entry.title}
              open={modalOpen === entry.key}
              onCancel={() => setModalOpen('')}
              footer={entry.data.length ? [
                <Button key="export" icon={<ExportOutlined />} onClick={() => void exportRowsToExcel(entry.data, analyticsColumnIndex.statistics, entry.title.replace(/\s+/g, '_'), entry.title)}>
                  Export
                </Button>,
              ] : null}
              style={{ top: '10%' }}
            >
              {entry.error && (
                <InlineAlert
                  variant="error"
                  style={{ marginBottom: 12 }}
                  title="Unable to load metrics"
                  onRetry={entry.retry}
                />
              )}
              <DateUnitFilter
                filterParams={{ unit: unitByKey[entry.key] }}
                onChange={(params) => {
                  const unit = params.unit ?? 'day';
                  setUnitByKey((old) => ({ ...old, [entry.key]: unit }));
                }}
              />
              <div style={{ height: 12 }} />
              <StatisticsChart dataSource={entry.data} unit={entry.unit} bucketUnit={unitByKey[entry.key]} color={chartTheme.series[entry.colorIndex]} />
            </Modal>
          </Col>
        );
      })}
    </Row>
  );
}
