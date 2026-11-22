import { Button, Empty, List, Skeleton, Space, Table, Typography } from 'antd';
import { ApiOutlined, ArrowRightOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { InlineAlert } from '@/shared/notifications';
import { useGetTargetTelemetryQuery } from '../api';
import { DEVICE_STATE_TONE, TARGET_TYPE_LABEL, describeModbus } from '../format';
import type { Channel, DeviceDetail, TargetType } from '../types';
import { AddDeviceWizard } from './AddDeviceWizard';
import { DeviceDrawer } from './DeviceDrawer';

interface TargetTelemetryPanelProps {
  type: TargetType;
  id: number;
  name?: string;
}

/** The Telemetry tab of a room, station, bench or equipment item: what is installed here, and what is measured about it. */
export function TargetTelemetryPanel({ type, id, name }: TargetTelemetryPanelProps) {
  const { data, isFetching, isError, refetch } = useGetTargetTelemetryQuery({ type, id });
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [claimDevice, setClaimDevice] = useState<DeviceDetail | null>(null);
  const label = TARGET_TYPE_LABEL[type].toLowerCase();

  if (isError) {
    return (
      <InlineAlert
        variant="warning"
        title="Unable to load telemetry data"
        onRetry={() => void refetch()}
      />
    );
  }
  if (!data && isFetching) return <Skeleton active />;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Text type="secondary">
          Devices installed at this {label} and the measurements that describe it.
        </Typography.Text>
        <Space>
          <Link to={type === 'room' ? `/telemetry/devices?room_id=${id}` : '/telemetry/devices'}>
            All sensors <ArrowRightOutlined />
          </Link>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setWizardOpen(true)}>Add device here</Button>
        </Space>
      </Space>

      <div>
        <Typography.Title level={5}>Installed here</Typography.Title>
        <List
          size="small"
          bordered
          dataSource={data?.installed_devices ?? []}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No device is installed at this ${label}.`} /> }}
          renderItem={(device) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => setDeviceId(device.id)}
              actions={[<Typography.Text key="count" type="secondary">{device.channel_count} measurement{device.channel_count === 1 ? '' : 's'}</Typography.Text>]}
            >
              <List.Item.Meta
                avatar={<ApiOutlined style={{ fontSize: 18, color: 'var(--lm-text-secondary)' }} />}
                title={<Space>{device.model || device.kind.label}<StatusBadge tone={DEVICE_STATE_TONE[device.state.value]} label={device.state.label} fit /></Space>}
                description={`${device.device_uid} · ${describeModbus(device.modbus)}`}
              />
            </List.Item>
          )}
        />
      </div>

      <div>
        <Typography.Title level={5}>Measurements about this {label}</Typography.Title>
        <Table<Channel>
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={data?.channels ?? []}
          onRow={(channel) => ({ onClick: () => setDeviceId(channel.source.id), style: { cursor: 'pointer' } })}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing measures this yet." /> }}
          columns={[
            { title: 'Measurement', render: (_, channel) => <span>{channel.metric.name} <Typography.Text type="secondary">({channel.unit})</Typography.Text></span> },
            { title: 'Label', dataIndex: 'label', render: (value: string) => value || '—' },
            { title: 'Device', render: (_, channel) => channel.source.name },
            { title: 'Address', dataIndex: 'unit_id', width: 90 },
            { title: 'Read', dataIndex: 'is_enabled', width: 90, render: (value: boolean) => <StatusBadge tone={value ? 'success' : 'neutral'} label={value ? 'On' : 'Off'} fit /> },
          ]}
        />
      </div>

      <DeviceDrawer deviceId={deviceId} onClose={() => setDeviceId(null)} onClaim={(device) => { setClaimDevice(device); setWizardOpen(true); }} />
      <AddDeviceWizard
        open={wizardOpen}
        claimDevice={claimDevice}
        initialLocation={{ type, id, name }}
        onClose={() => { setWizardOpen(false); setClaimDevice(null); }}
        onSaved={(savedId) => setDeviceId(savedId)}
      />
    </Space>
  );
}

export default TargetTelemetryPanel;
