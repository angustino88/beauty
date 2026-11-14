import { useState } from 'react';
import { Alert, Card, DatePicker, Empty, Progress, Space, Table, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useLabsAnalyticsBookedVsUsedRetrieveQuery,
  useLabsAnalyticsEquipmentAvailabilityRetrieveQuery,
} from '@/shared/api/generated/api';
import { DEFAULT_DURATION, DEFAULT_TIMEZONE } from '../../utils/charts';

const { RangePicker } = DatePicker;

export function OperationalAnalyticsCards() {
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
      <Space style={{ marginBottom: 16 }} wrap>
        <Typography.Text strong>Reporting period</Typography.Text>
        <RangePicker
          value={range}
          allowClear={false}
          onChange={(dates) => {
            if (dates?.[0] && dates[1] && !dates[0].isAfter(dates[1])) setRange([dates[0], dates[1]]);
          }}
        />
      </Space>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16 }}>
        <Card title="Booked vs used hours" loading={bookings.isFetching}>
          {bookings.isError ? <Alert type="error" showIcon message="Unable to load booking utilization" action={<a onClick={() => void bookings.refetch()}>Retry</a>} /> : bookingData ? (
            <>
              <Space size="large" wrap style={{ marginBottom: 16 }}>
                <Typography.Text>Booked: <strong>{bookingData.total_booked_hours.toFixed(1)} h</strong></Typography.Text>
                <Typography.Text>Used: <strong>{bookingData.total_used_hours.toFixed(1)} h</strong></Typography.Text>
                <Typography.Text>Working: <strong>{bookingData.official_working_hours.toFixed(1)} h</strong></Typography.Text>
              </Space>
              <Typography.Text>Used to booked: {bookingData.used_to_booked_ratio == null ? 'N/A' : `${(bookingData.used_to_booked_ratio * 100).toFixed(1)}%`}</Typography.Text>
              <Table rowKey="bench_id" size="small" pagination={{ pageSize: 5 }} dataSource={bookingData.benches} columns={[
                { title: 'Bench', dataIndex: 'bench_name' },
                { title: 'Booked hours', dataIndex: 'booked_hours', align: 'right', render: (value: number) => value.toFixed(1) },
              ]} style={{ marginTop: 16 }} />
            </>
          ) : <Empty description="No utilization data" />}
        </Card>
        <Card title="Equipment availability" loading={availability.isFetching}>
          {availability.isError ? <Alert type="error" showIcon message="Unable to load equipment availability" action={<a onClick={() => void availability.refetch()}>Retry</a>} /> : equipmentData ? (
            <>
              <Space size="large" wrap style={{ marginBottom: 16 }}>
                <Typography.Text>Equipment: <strong>{equipmentData.equipment_count}</strong></Typography.Text>
                <Typography.Text>Average uptime: <strong>{equipmentData.average_uptime_percent == null ? 'N/A' : `${equipmentData.average_uptime_percent.toFixed(1)}%`}</strong></Typography.Text>
              </Space>
              <Table rowKey="equipment_id" size="small" pagination={{ pageSize: 5 }} dataSource={equipmentData.items} columns={[
                { title: 'Equipment', dataIndex: 'equipment_name' },
                { title: 'Uptime', dataIndex: 'uptime_percent', render: (value: number) => <Progress percent={Math.max(0, Math.min(100, value))} size="small" format={() => `${value.toFixed(1)}%`} /> },
                { title: 'Unavailable', dataIndex: 'unavailable_hours', align: 'right', render: (value: number) => `${value.toFixed(1)} h` },
                { title: 'Outages', dataIndex: 'outage_count', align: 'right' },
                { title: 'Status', dataIndex: 'current_status' },
              ]} style={{ marginTop: 16 }} />
            </>
          ) : <Empty description="No availability data" />}
        </Card>
      </div>
    </>
  );
}
