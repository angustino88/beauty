import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { DisconnectOutlined, EditOutlined, LinkOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { StatusBadge } from '@/shared/components/StatusBadge';
import {
  useBindChannelTargetMutation,
  useCreateChannelsFromProfileMutation,
  useGetDeviceProfilesQuery,
  useGetTelemetryDeviceQuery,
  useRetireDeviceMutation,
  useUnbindChannelMutation,
  useUpdateChannelMutation,
  useUpdateSourceMutation,
} from '../api';
import { readApiProblem, toFormErrors } from '../errors';
import { DEVICE_STATE_TONE, TARGET_TYPE_LABEL, describeModbus, isNetworkHost, timeAgo } from '../format';
import type { Channel, DeviceDetail } from '../types';
import { TargetPicker, type TargetValue } from './TargetPicker';

const toTargetValue = (target: { type: TargetValue['type']; id: number; name: string } | null | undefined) =>
  target ? { type: target.type, id: target.id, name: target.name } : null;

function TargetLabel({ target }: { target: { type: TargetValue['type']; name: string } | null }) {
  if (!target) return <Typography.Text type="secondary">Not linked</Typography.Text>;
  return (
    <span>
      <Typography.Text type="secondary">{TARGET_TYPE_LABEL[target.type]} · </Typography.Text>
      {target.name}
    </span>
  );
}

function MeasuresCell({ channel, sourceId }: { channel: Channel; sourceId: number }) {
  const [open, setOpen] = useState(false);
  const [bind, bindState] = useBindChannelTargetMutation();
  const [unbind, unbindState] = useUnbindChannelMutation();
  const change = async (target: TargetValue | null) => {
    if (!target) return;
    try {
      await bind({ id: channel.id, sourceId, target_type: target.type, target_id: target.id }).unwrap();
      setOpen(false);
      void message.success(`Now measuring ${TARGET_TYPE_LABEL[target.type].toLowerCase()} ${target.name ?? ''}`);
    } catch (error) {
      void message.error(readApiProblem(error).message);
    }
  };
  return (
    <Space size={4}>
      <TargetLabel target={channel.measures?.target ?? null} />
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger="click"
        title="What does this measurement describe?"
        content={
          <div style={{ width: 420 }}>
            <TargetPicker value={toTargetValue(channel.measures?.target)} onChange={(target) => void change(target)} />
            <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0', fontSize: 12 }}>
              Must be in the room where the device is installed. History stays with the previous target.
            </Typography.Paragraph>
          </div>
        }
      >
        <Tooltip title="Change">
          <Button size="small" type="text" icon={<LinkOutlined />} loading={bindState.isLoading} aria-label="Change measured target" />
        </Tooltip>
      </Popover>
      {channel.measures && (
        <Popconfirm
          title="Stop linking this measurement?"
          description="Readings are kept but no longer attributed until you link it again."
          onConfirm={() => unbind({ id: channel.id, sourceId }).unwrap().catch((error) => message.error(readApiProblem(error).message))}
        >
          <Tooltip title="Unlink">
            <Button size="small" type="text" icon={<DisconnectOutlined />} loading={unbindState.isLoading} aria-label="Unlink" />
          </Tooltip>
        </Popconfirm>
      )}
    </Space>
  );
}

function ChannelsTable({ device }: { device: DeviceDetail }) {
  const [update] = useUpdateChannelMutation();
  const patch = (channel: Channel, body: { label?: string; is_enabled?: boolean }) =>
    update({ id: channel.id, sourceId: device.id, body })
      .unwrap()
      .catch((error) => message.error(readApiProblem(error).message));
  return (
    <Table<Channel>
      size="small"
      rowKey="id"
      pagination={false}
      dataSource={device.channels}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No measurements yet. Add the sensors on this device's bus." /> }}
      columns={[
        { title: 'Address', dataIndex: 'unit_id', width: 84, render: (value: number | null) => value ?? '—' },
        {
          title: 'Measurement',
          key: 'metric',
          render: (_, channel) => (
            <Space direction="vertical" size={0}>
              <span>{channel.metric.name} <Typography.Text type="secondary">({channel.unit})</Typography.Text></span>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12 }}
                editable={{ onChange: (label) => label !== channel.label && void patch(channel, { label }), tooltip: 'Rename' }}
              >
                {channel.label || 'No label'}
              </Typography.Text>
            </Space>
          ),
        },
        { title: 'Profile', key: 'profile', render: (_, channel) => channel.profile?.name ?? '—' },
        { title: 'Measures', key: 'measures', render: (_, channel) => <MeasuresCell channel={channel} sourceId={device.id} /> },
        {
          title: 'Read',
          dataIndex: 'is_enabled',
          width: 64,
          render: (value: boolean, channel) => (
            <Switch size="small" checked={value} aria-label="Read this measurement" onChange={(checked) => void patch(channel, { is_enabled: checked })} />
          ),
        },
      ]}
    />
  );
}

function AddSensorModal({ device, open, onClose }: { device: DeviceDetail; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<{ unit_id: number; profile_id: number; measures?: TargetValue | null; label?: string }>();
  const { data: profiles } = useGetDeviceProfilesQuery({ status: 'approved', page_size: 100 }, { skip: !open });
  const [create, state] = useCreateChannelsFromProfileMutation();
  const used = new Set(device.channels.map((channel) => channel.unit_id));
  const submit = async () => {
    const values = await form.validateFields();
    const target = values.measures ?? toTargetValue(device.install_location);
    try {
      await create({
        sourceId: device.id,
        body: {
          unit_id: values.unit_id,
          profile_id: values.profile_id,
          label: values.label?.trim() ?? '',
          ...(target ? { target_type: target.type, target_id: target.id } : {}),
        },
      }).unwrap();
      void message.success('Sensor added');
      form.resetFields();
      onClose();
    } catch (error) {
      const problem = readApiProblem(error);
      form.setFields(toFormErrors(problem, ['unit_id', 'profile_id', 'measures', 'label'], { target_type: 'measures', target_id: 'measures' }).matched as never);
      void message.error(problem.message);
    }
  };
  return (
    <Modal open={open} title="Add a sensor" onCancel={onClose} onOk={() => void submit()} okText="Add sensor" confirmLoading={state.isLoading} destroyOnHidden>
      <Form form={form} layout="vertical" requiredMark="optional" initialValues={{ unit_id: Math.max(0, ...[...used].map(Number)) + 1 }}>
        <Form.Item
          name="unit_id"
          label="Modbus address"
          extra="The address set on the sensor itself (1–247)."
          rules={[
            { required: true },
            { validator: (_, value) => (used.has(value) ? Promise.reject(new Error('Another sensor already uses this address.')) : Promise.resolve()) },
          ]}
        >
          <InputNumber min={1} max={247} />
        </Form.Item>
        <Form.Item name="profile_id" label="Device profile" rules={[{ required: true, message: 'Choose the sensor model.' }]}>
          <Select
            placeholder="Approved profiles"
            options={(profiles?.data ?? []).map((profile) => ({
              value: profile.id,
              label: `${profile.model || profile.key} · ${profile.reference} (${Object.keys(profile.read_map).join(', ')})`,
            }))}
          />
        </Form.Item>
        <Form.Item name="measures" label="Measures" extra="Leave empty to use the install location.">
          <TargetPicker />
        </Form.Item>
        <Form.Item name="label" label="Label">
          <Input placeholder="e.g. Main feed" maxLength={120} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function EditSourceModal({ device, open, onClose }: { device: DeviceDetail; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<{ location: TargetValue | null; network_host: string; port: number; model: string }>();
  const [update, state] = useUpdateSourceMutation();
  const submit = async () => {
    const values = await form.validateFields();
    const modbus = device.modbus;
    try {
      await update({
        id: device.id,
        body: {
          model: values.model,
          ...(values.location ? { install_location_type: values.location.type, install_location_id: values.location.id } : {}),
          modbus: {
            network_host: values.network_host,
            port: values.port,
            framing: modbus?.framing.value ?? 'mbap',
            serial_interface: modbus?.serial_interface?.value ?? '',
            baud_rate: modbus?.baud_rate ?? null,
            parity: modbus?.parity?.value ?? '',
            data_bits: modbus?.data_bits ?? null,
            stop_bits: modbus?.stop_bits ?? null,
            request_timeout_ms: modbus?.request_timeout_ms ?? 800,
            has_shared_bus: modbus?.has_shared_bus ?? true,
          },
        },
      }).unwrap();
      void message.success('Device updated');
      onClose();
    } catch (error) {
      const problem = readApiProblem(error);
      form.setFields(toFormErrors(problem, ['location', 'network_host', 'port', 'model'], {
        install_location_type: 'location', install_location_id: 'location', 'modbus.network_host': 'network_host', 'modbus.port': 'port',
      }).matched as never);
      void message.error(problem.message);
    }
  };
  return (
    <Modal open={open} title="Edit device" onCancel={onClose} onOk={() => void submit()} okText="Save" confirmLoading={state.isLoading} destroyOnHidden>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          location: toTargetValue(device.install_location),
          network_host: device.modbus?.network_host ?? '',
          port: device.modbus?.port ?? 502,
          model: device.model,
        }}
      >
        <Form.Item name="location" label="Installed at" extra="Moving to another room needs its measurements unlinked first.">
          <TargetPicker />
        </Form.Item>
        <Space.Compact block>
          <Form.Item
            name="network_host"
            label="IP address"
            style={{ flex: 3 }}
            rules={[{ required: true }, { validator: (_, value) => (!value || isNetworkHost(value) ? Promise.resolve() : Promise.reject(new Error('Enter an IP address or host name.'))) }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="port" label="Port" style={{ flex: 1, marginLeft: 12 }}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
        </Space.Compact>
        <Form.Item name="model" label="Model">
          <Input maxLength={120} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

interface DeviceDrawerProps {
  deviceId: number | null;
  onClose: () => void;
  onClaim: (device: DeviceDetail) => void;
}

export function DeviceDrawer({ deviceId, onClose, onClaim }: DeviceDrawerProps) {
  const { data: device, isFetching, isError, refetch } = useGetTelemetryDeviceQuery(deviceId ?? skipToken);
  const [retire, retireState] = useRetireDeviceMutation();
  const [sensorOpen, setSensorOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const isSource = device?.role.value === 'source';
  const claimed = device?.state.value === 'claimed';

  return (
    <Drawer
      open={deviceId !== null}
      onClose={onClose}
      width={880}
      title={device ? (
        <Space>
          <span>{device.model || device.kind.label}</span>
          <Typography.Text type="secondary" copyable style={{ fontWeight: 400 }}>{device.device_uid}</Typography.Text>
          <StatusBadge tone={DEVICE_STATE_TONE[device.state.value]} label={device.state.label} fit />
        </Space>
      ) : 'Device'}
      extra={device && (
        <Space>
          {device.state.value === 'discovered' && <Button type="primary" onClick={() => onClaim(device)}>Claim</Button>}
          {isSource && claimed && <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Edit</Button>}
          {device.state.value !== 'retired' && (
            <Popconfirm
              title="Retire this device?"
              description={isSource ? 'Its measurements stop, its IP address is released and history is kept.' : 'It stops covering its room; history is kept.'}
              okButtonProps={{ danger: true }}
              okText="Retire"
              onConfirm={() => retire(device.id).unwrap().then(() => message.success('Device retired')).catch((error) => message.error(readApiProblem(error).message))}
            >
              <Button danger icon={<StopOutlined />} loading={retireState.isLoading}>Retire</Button>
            </Popconfirm>
          )}
        </Space>
      )}
    >
      {isError && <Alert type="warning" showIcon title="The device could not be loaded" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>} />}
      {!device && isFetching && <Skeleton active />}
      {device && (
        <>
          {device.state.value === 'discovered' && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              title="Found on the network, not configured yet"
              description={`Reported by ${device.reported_by?.name ?? 'a gateway'}${device.last_seen_address ? ` at ${device.last_seen_address}` : ''}. Claim it to say what it is and where it is installed.`}
            />
          )}
          <Descriptions
            size="small"
            column={2}
            items={[
              { key: 'kind', label: 'Type', children: device.kind.label },
              { key: 'asset', label: 'Inventory asset', children: device.equipment?.name ?? '—' },
              ...(isSource
                ? [
                    { key: 'location', label: 'Installed at', children: <TargetLabel target={device.install_location} /> },
                    { key: 'room', label: 'Room', children: device.room?.name ?? '—' },
                    { key: 'address', label: 'Network and bus', span: 2, children: describeModbus(device.modbus) },
                  ]
                : [
                    { key: 'scope', label: 'Covers', children: <TargetLabel target={device.scope} /> },
                    {
                      key: 'config',
                      label: 'Configuration',
                      children: device.config_version_applied === device.config_version
                        ? <StatusBadge tone="success" label={`Up to date (v${device.config_version})`} fit />
                        : <StatusBadge tone="warning" label={`v${device.config_version_applied ?? 0} of v${device.config_version}`} title="The gateway has not loaded the latest configuration yet." fit />,
                    },
                  ]),
              { key: 'seen', label: 'Last seen', children: timeAgo(device.last_seen_at) },
              { key: 'manufacturer', label: 'Manufacturer', children: device.manufacturer || '—' },
            ]}
          />
          {isSource && (
            <>
              <Space style={{ width: '100%', justifyContent: 'space-between', margin: '24px 0 8px' }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Measurements</Typography.Title>
                {claimed && <Button icon={<PlusOutlined />} onClick={() => setSensorOpen(true)}>Add sensor</Button>}
              </Space>
              <ChannelsTable device={device} />
              {claimed && <AddSensorModal device={device} open={sensorOpen} onClose={() => setSensorOpen(false)} />}
              {claimed && <EditSourceModal device={device} open={editOpen} onClose={() => setEditOpen(false)} />}
            </>
          )}
        </>
      )}
    </Drawer>
  );
}

export default DeviceDrawer;
