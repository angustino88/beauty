import { Button, Input, Segmented, Select, Space, Table, Typography } from 'antd';
import { ApiOutlined, CloudServerOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useGetTargetOptionsQuery, useGetTelemetryDevicesQuery } from '../api';
import { AddDeviceWizard } from '../components/AddDeviceWizard';
import { DeviceDrawer } from '../components/DeviceDrawer';
import { GatewayModal } from '../components/GatewayModal';
import { DEVICE_STATE_TONE, TARGET_TYPE_LABEL, describeModbus, timeAgo } from '../format';
import type { Device, DeviceDetail, DeviceRole, DeviceState } from '../types';
import styles from './telemetry.module.css';

function SummaryTile({ label, value, hint, attention, onClick }: {
  label: string;
  value: number | undefined;
  hint: string;
  attention?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={styles.tile} data-attention={attention ? 'true' : undefined} onClick={onClick}>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileValue}>{value ?? '–'}</span>
      <span className={styles.tileHint}>{hint}</span>
    </button>
  );
}

export default function TelemetryDevicesPage() {
  const [params, setParams] = useSearchParams();
  const roomId = params.get('room_id') ? Number(params.get('room_id')) : undefined;
  const role = (params.get('role') as DeviceRole | null) ?? undefined;
  const state = (params.get('state') as DeviceState | null) ?? undefined;
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search, 400).trim() || undefined;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [openDeviceId, setOpenDeviceId] = useState<number | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [claimDevice, setClaimDevice] = useState<DeviceDetail | null>(null);
  const [gatewayOpen, setGatewayOpen] = useState(false);

  const setFilter = (key: string, value: string | number | undefined) => {
    const next = new URLSearchParams(params);
    if (value === undefined || value === '') next.delete(key);
    else next.set(key, String(value));
    setParams(next, { replace: true });
    setPage(1);
  };

  const { data, isFetching } = useGetTelemetryDevicesQuery({ role, state, room_id: roomId, q, page, page_size: pageSize });
  const scope = { room_id: roomId, page_size: 1 };
  const gateways = useGetTelemetryDevicesQuery({ ...scope, role: 'gateway' });
  const inUse = useGetTelemetryDevicesQuery({ ...scope, role: 'source', state: 'claimed' });
  const awaiting = useGetTelemetryDevicesQuery({ ...scope, state: 'discovered' });
  const { data: rooms } = useGetTargetOptionsQuery({ type: 'room' });
  const count = (result: typeof gateways) => result.data?.meta?.pagination?.count;

  const columns = useMemo(() => [
    {
      title: 'Device',
      key: 'device',
      render: (_: unknown, device: Device) => (
        <Space size={10}>
          <span className={styles.deviceIcon} aria-hidden="true">
            {device.role.value === 'gateway' ? <CloudServerOutlined /> : <ApiOutlined />}
          </span>
          <Space direction="vertical" size={0}>
            <span className={styles.deviceName}>{device.model || device.equipment?.name || device.kind.label}</span>
            <Typography.Text type="secondary" className={styles.mono}>{device.device_uid}</Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'State',
      key: 'state',
      width: 140,
      render: (_: unknown, device: Device) => <StatusBadge tone={DEVICE_STATE_TONE[device.state.value]} label={device.state.label} />,
    },
    {
      title: 'Installed at / covers',
      key: 'where',
      render: (_: unknown, device: Device) => {
        const target = device.role.value === 'gateway' ? device.scope : device.install_location;
        return target ? (
          <span><Typography.Text type="secondary">{TARGET_TYPE_LABEL[target.type]} · </Typography.Text>{target.name}</span>
        ) : <Typography.Text type="secondary">—</Typography.Text>;
      },
    },
    { title: 'Room', key: 'room', render: (_: unknown, device: Device) => device.room?.name ?? '—' },
    {
      title: 'Network',
      key: 'network',
      render: (_: unknown, device: Device) => device.role.value === 'gateway'
        ? <Typography.Text type="secondary">Config v{device.config_version_applied ?? 0}/{device.config_version}</Typography.Text>
        : <span className={styles.mono}>{describeModbus(device.modbus)}</span>,
    },
    { title: 'Measurements', dataIndex: 'channel_count', width: 120, align: 'right' as const },
    { title: 'Last seen', key: 'seen', width: 120, render: (_: unknown, device: Device) => timeAgo(device.last_seen_at) },
  ], []);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Sensors & gateways"
        description="Converters, meters and probes, where they are installed, and the gateway PCs that read them."
        controls={
          <Space>
            <Button icon={<CloudServerOutlined />} onClick={() => setGatewayOpen(true)}>Register gateway</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setWizardOpen(true)}>Add device</Button>
          </Space>
        }
      />

      <div className={styles.tiles}>
        <SummaryTile label="Gateways" value={count(gateways)} hint="PCs reading rooms" onClick={() => setFilter('role', 'gateway')} />
        <SummaryTile label="Devices in use" value={count(inUse)} hint="Claimed and installed" onClick={() => { setFilter('role', 'source'); }} />
        <SummaryTile
          label="Awaiting setup"
          value={count(awaiting)}
          hint="Found on the network, not claimed"
          attention={(count(awaiting) ?? 0) > 0}
          onClick={() => setFilter('state', 'discovered')}
        />
      </div>

      <div className={styles.toolbar}>
        <Segmented
          value={role ?? 'all'}
          options={[{ value: 'all', label: 'All' }, { value: 'source', label: 'Devices' }, { value: 'gateway', label: 'Gateways' }]}
          onChange={(value) => setFilter('role', value === 'all' ? undefined : String(value))}
        />
        <Select
          allowClear
          placeholder="Any state"
          style={{ width: 150 }}
          value={state}
          options={[{ value: 'claimed', label: 'In use' }, { value: 'discovered', label: 'Awaiting setup' }, { value: 'retired', label: 'Retired' }]}
          onChange={(value) => setFilter('state', value)}
        />
        <Select
          allowClear
          showSearch={{ optionFilterProp: 'label' }}
          placeholder="All rooms"
          style={{ width: 200 }}
          value={roomId}
          options={(rooms ?? []).map((room) => ({ value: room.id, label: room.name }))}
          onChange={(value) => setFilter('room_id', value)}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="MAC, model, asset or IP"
          style={{ width: 260, marginLeft: 'auto' }}
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
      </div>

      <Table<Device>
        rowKey="id"
        size="middle"
        loading={isFetching}
        dataSource={data?.data ?? []}
        columns={columns}
        onRow={(device) => ({ onClick: () => setOpenDeviceId(device.id), style: { cursor: 'pointer' } })}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.pagination?.count ?? 0,
          showSizeChanger: true,
          onChange: (nextPage, nextSize) => { setPage(nextPage); setPageSize(nextSize); },
        }}
        locale={{
          emptyText: (
            <div className={styles.empty}>
              <Typography.Title level={5}>No devices yet</Typography.Title>
              <Typography.Paragraph type="secondary">
                Register the room's gateway PC, then add each converter or network meter and the sensors on its bus.
              </Typography.Paragraph>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setWizardOpen(true)}>Add device</Button>
            </div>
          ),
        }}
      />

      <DeviceDrawer
        deviceId={openDeviceId}
        onClose={() => setOpenDeviceId(null)}
        onClaim={(device) => { setClaimDevice(device); setWizardOpen(true); }}
      />
      <AddDeviceWizard
        open={wizardOpen}
        claimDevice={claimDevice}
        onClose={() => { setWizardOpen(false); setClaimDevice(null); }}
        onSaved={(id) => setOpenDeviceId(id)}
      />
      <GatewayModal open={gatewayOpen} onClose={() => setGatewayOpen(false)} onSaved={(id) => setOpenDeviceId(id)} />
    </div>
  );
}
