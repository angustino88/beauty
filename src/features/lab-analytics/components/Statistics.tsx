import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Modal, Row, Statistic, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
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
        color: '#1f7a4d',
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
        color: '#d17a00',
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
        color: '#2f6f8f',
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
        color: '#7c6f9c',
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
        const trend = entry.statistics?.trend;
        const trendEl = trend && trend !== 0 ? (
          <Typography.Text style={{ color: trend > 0 ? '#3f8600' : '#cf1322' }}>
            {trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend)}%
          </Typography.Text>
        ) : null;

        return (
          <Col xs={24} sm={12} lg={6} key={entry.key}>
            <Card
              hoverable
              style={{ height: '100%', width: '100%' }}
              styles={{ body: { padding: '18px 20px' } }}
              onClick={() => setModalOpen(entry.key)}
              loading={entry.loading}
            >
              <Statistic
                style={{ width: '100%' }}
                title={
                  <Row justify="space-between" style={{ gap: 8 }}>
                    <Typography.Title level={5}>{entry.title}</Typography.Title>
                    {trendEl}
                  </Row>
                }
                value={entry.statistics?.count}
              />
              {entry.error && <Typography.Text type="danger">Unable to load metrics</Typography.Text>}
              {entry.data.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {`${unitByKey[entry.key]} trend`}
                  </Typography.Text>
                  <div style={{ height: 38, marginTop: 2 }} aria-hidden="true">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={entry.data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={entry.color}
                          strokeWidth={2}
                          fill={entry.color}
                          fillOpacity={0.12}
                          isAnimationActive
                          animationDuration={600}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Card>

            <Modal
              width="min(1080px, calc(100vw - 32px))"
              key={entry.key}
              title={entry.title}
              open={modalOpen === entry.key}
              onCancel={() => setModalOpen('')}
              footer={null}
              style={{ top: '10%' }}
            >
              {entry.error && <Alert type="error" showIcon message="Unable to load metrics" action={<Button size="small" onClick={entry.retry}>Retry</Button>} />}
              <DateUnitFilter
                filterParams={{ unit: unitByKey[entry.key] }}
                onChange={(params) => {
                  const unit = params.unit ?? 'day';
                  setUnitByKey((old) => ({ ...old, [entry.key]: unit }));
                }}
                onExport={entry.data.length ? () => void exportRowsToExcel(entry.data, analyticsColumnIndex.statistics, entry.title.replace(/\s+/g, '_'), entry.title) : undefined}
              />
              <StatisticsChart dataSource={entry.data} unit={entry.unit} bucketUnit={unitByKey[entry.key]} color={entry.color} />
            </Modal>
          </Col>
        );
      })}
    </Row>
  );
}
