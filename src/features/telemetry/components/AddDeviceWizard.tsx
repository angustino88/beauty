import {
  Button,
  Collapse,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Segmented,
  Select,
  Space,
  Steps,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { InlineAlert, notify } from '@/shared/notifications';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import {
  useClaimSourceMutation,
  useCreateChannelsFromProfileMutation,
  useCreateSourceMutation,
  useGetDeviceProfilesQuery,
} from '../api';
import { readApiProblem, toFormErrors } from '../errors';
import { SERIAL_PRESETS, TARGET_TYPE_LABEL, duplicateUnitIds, isNetworkHost, normalizeDeviceUid } from '../format';
import type { Device, ModbusSettingsInput } from '../types';
import { EquipmentSelect } from './EquipmentSelect';
import { TargetPicker, type TargetValue } from './TargetPicker';

interface SensorRow {
  unit_id?: number;
  profile_id?: number;
  measures?: TargetValue | null;
  label?: string;
}

interface WizardValues {
  mode: 'converter' | 'native';
  device_uid: string;
  manufacturer?: string;
  model?: string;
  equipment_id?: number;
  location?: TargetValue | null;
  network_host: string;
  port: number;
  framing: 'mbap' | 'rtu_over_tcp';
  serial_interface: 'rs485' | 'rs232';
  serial_preset: string;
  baud_rate: number;
  parity: 'N' | 'E' | 'O';
  data_bits: number;
  stop_bits: number;
  has_shared_bus: boolean;
  request_timeout_ms: number;
  sensors: SensorRow[];
}

const STEP_FIELDS: (keyof WizardValues)[][] = [
  ['mode', 'device_uid', 'manufacturer', 'model', 'equipment_id'],
  ['location', 'network_host', 'port', 'framing', 'serial_interface', 'baud_rate', 'parity', 'data_bits', 'stop_bits', 'request_timeout_ms'],
  ['sensors'],
  [],
];

const FORM_FIELDS = [
  'device_uid', 'manufacturer', 'model', 'equipment_id', 'location', 'network_host', 'port', 'framing',
  'serial_interface', 'baud_rate', 'parity', 'data_bits', 'stop_bits', 'request_timeout_ms',
];
const API_TO_FORM: Record<string, string> = {
  install_location_type: 'location',
  install_location_id: 'location',
  'modbus.network_host': 'network_host',
  'modbus.port': 'port',
  'modbus.framing': 'framing',
  'modbus.serial_interface': 'serial_interface',
  'modbus.baud_rate': 'baud_rate',
  'modbus.parity': 'parity',
  'modbus.data_bits': 'data_bits',
  'modbus.stop_bits': 'stop_bits',
  'modbus.request_timeout_ms': 'request_timeout_ms',
};
const FIELD_STEP: Record<string, number> = Object.fromEntries(
  STEP_FIELDS.flatMap((fields, step) => fields.map((field) => [field, step])),
);

const INITIAL: Partial<WizardValues> = {
  mode: 'converter',
  port: 502,
  framing: 'mbap',
  serial_interface: 'rs485',
  serial_preset: '9600-8N1',
  baud_rate: 9600,
  parity: 'N',
  data_bits: 8,
  stop_bits: 1,
  has_shared_bus: true,
  request_timeout_ms: 800,
  sensors: [],
};

interface AddDeviceWizardProps {
  open: boolean;
  onClose: () => void;
  /** Called with the device id after it was saved (even if some sensors failed). */
  onSaved?: (deviceId: number) => void;
  /** Claim a discovered device instead of registering a new one. */
  claimDevice?: Device | null;
  /** Pre-fills the install location (e.g. opened from a station's Telemetry tab). */
  initialLocation?: TargetValue | null;
}

function modbusInput(values: WizardValues): ModbusSettingsInput {
  const converter = values.mode === 'converter';
  return {
    network_host: values.network_host.trim(),
    port: values.port,
    framing: values.framing,
    serial_interface: converter ? values.serial_interface : '',
    baud_rate: converter ? values.baud_rate : null,
    parity: converter ? values.parity : '',
    data_bits: converter ? values.data_bits : null,
    stop_bits: converter ? values.stop_bits : null,
    request_timeout_ms: values.request_timeout_ms,
    has_shared_bus: converter ? values.has_shared_bus : false,
  };
}

export function AddDeviceWizard({ open, onClose, onSaved, claimDevice, initialLocation }: AddDeviceWizardProps) {
  const [form] = Form.useForm<WizardValues>();
  const [step, setStep] = useState(0);
  const [banner, setBanner] = useState<string | null>(null);
  const [createSource, createState] = useCreateSourceMutation();
  const [claimSource, claimState] = useClaimSourceMutation();
  const [createChannels, channelsState] = useCreateChannelsFromProfileMutation();
  const { data: profiles, isFetching: profilesLoading } = useGetDeviceProfilesQuery(
    { status: 'approved', page_size: 100 },
    { skip: !open },
  );

  const mode = Form.useWatch('mode', form);
  const deviceUid = Form.useWatch('device_uid', form);
  const location = Form.useWatch('location', form);
  const sensors = Form.useWatch('sensors', form) as SensorRow[] | undefined;
  const values = Form.useWatch([], form) as WizardValues | undefined;

  const profileOptions = useMemo(
    () => (profiles?.data ?? []).map((profile) => ({
      value: profile.id,
      label: `${profile.model || profile.key} · ${profile.reference}`,
      metrics: Object.keys(profile.read_map),
    })),
    [profiles],
  );
  const duplicates = duplicateUnitIds((sensors ?? []).map((row) => row?.unit_id));
  const saving = createState.isLoading || claimState.isLoading || channelsState.isLoading;
  const claiming = Boolean(claimDevice);

  const reset = () => {
    form.resetFields();
    setStep(0);
    setBanner(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const next = async () => {
    try {
      await form.validateFields(STEP_FIELDS[step] as string[], { recursive: true });
      if (step === 2 && duplicates.length) return;
      setStep((current) => current + 1);
    } catch {
      /* antd shows the field errors */
    }
  };

  const showProblem = (error: unknown) => {
    const problem = readApiProblem(error);
    const { matched, unmatched } = toFormErrors(problem, FORM_FIELDS, API_TO_FORM);
    form.setFields(matched as never);
    const firstStep = Math.min(...matched.map((item) => FIELD_STEP[item.name[0] as string] ?? 3), 3);
    if (matched.length) setStep(firstStep);
    setBanner(unmatched.length ? `${problem.message} ${unmatched.map((item) => item.message).join(' ')}` : problem.message);
  };

  const submit = async () => {
    const all = form.getFieldsValue(true) as WizardValues;
    if (!all.location || all.equipment_id == null) {
      setStep(!all.equipment_id ? 0 : 1);
      return;
    }
    setBanner(null);
    let deviceId: number;
    try {
      const body = {
        equipment_id: all.equipment_id,
        install_location_type: all.location.type,
        install_location_id: all.location.id,
        modbus: modbusInput(all),
        manufacturer: all.manufacturer?.trim() ?? '',
        model: all.model?.trim() ?? '',
      };
      const saved = claimDevice
        ? await claimSource({ id: claimDevice.id, body }).unwrap()
        : await createSource({ kind: 'modbus_tcp', device_uid: all.device_uid, ...body }).unwrap();
      deviceId = saved.id;
    } catch (error) {
      showProblem(error);
      return;
    }

    const failures: string[] = [];
    for (const row of all.sensors ?? []) {
      if (!row?.unit_id || !row.profile_id) continue;
      const target = row.measures ?? all.location;
      try {
        await createChannels({
          sourceId: deviceId,
          body: {
            unit_id: row.unit_id,
            profile_id: row.profile_id,
            label: row.label?.trim() ?? '',
            target_type: target.type,
            target_id: target.id,
          },
        }).unwrap();
      } catch (error) {
        failures.push(`Address ${row.unit_id}: ${readApiProblem(error).message}`);
      }
    }
    if (failures.length) {
      notify.warning('Device saved, but some sensors were not added', {
        description: failures.join(' '),
        duration: 8000,
      });
    } else {
      notify.success(claiming ? 'Telemetry device claimed' : 'Telemetry device added');
    }
    onSaved?.(deviceId);
    close();
  };

  const location0 = initialLocation ?? null;

  return (
    <Modal
      open={open}
      onCancel={close}
      title={claiming ? `Claim device ${claimDevice?.device_uid}` : 'Add a device'}
      width={880}
      destroyOnHidden
      maskClosable={false}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Lab Mango stores what is installed where; the room gateway reads the device using these settings.
          </Typography.Text>
          <Space>
            {step > 0 && <Button onClick={() => setStep(step - 1)} disabled={saving}>Back</Button>}
            {step < 3 && <Button type="primary" onClick={() => void next()}>Next</Button>}
            {step === 3 && (
              <Button type="primary" loading={saving} onClick={() => void submit()}>
                {claiming ? 'Claim device' : 'Add device'}
              </Button>
            )}
          </Space>
        </Space>
      }
    >
      <Steps
        size="small"
        current={step}
        style={{ margin: '8px 0 20px' }}
        items={[
          { title: 'Device' },
          { title: 'Location & network' },
          { title: 'Sensors' },
          { title: 'Review' },
        ]}
      />
      {banner && (
        <InlineAlert
          variant="error"
          title={banner}
          dismissible
          onDismiss={() => setBanner(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form<WizardValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{
          ...INITIAL,
          device_uid: claimDevice?.device_uid ?? '',
          network_host: claimDevice?.last_seen_address ?? '',
          location: location0,
        }}
      >
        {/* Step 1: device ---------------------------------------------------------------------- */}
        <div hidden={step !== 0}>
          <Form.Item name="mode" label="What is it?" rules={[{ required: true }]}>
            <Radio.Group
              optionType="button"
              options={[
                { value: 'converter', label: 'Serial-to-network converter' },
                { value: 'native', label: 'Native Modbus TCP device' },
              ]}
            />
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ marginTop: -12 }}>
            {mode === 'native'
              ? 'A meter or sensor that is on the network itself and speaks Modbus TCP.'
              : 'A box such as a USR-W630 that connects RS485/RS232 sensors to Wi-Fi or Ethernet.'}
          </Typography.Paragraph>
          <Form.Item
            name="device_uid"
            label="MAC address or serial number"
            rules={[{ required: true, whitespace: true, message: 'Enter the identifier printed on the device label.' }]}
            extra={deviceUid ? `Saved as ${normalizeDeviceUid(deviceUid)}` : 'From the label on the device.'}
          >
            <Input placeholder="A4:CF:12:9B:00:21" disabled={claiming} autoComplete="off" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="manufacturer" label="Manufacturer" style={{ flex: 1 }}>
              <Input placeholder="PUSR" />
            </Form.Item>
            <Form.Item name="model" label="Model" style={{ flex: 1, marginLeft: 12 }}>
              <Input placeholder="USR-W630" />
            </Form.Item>
          </Space.Compact>
          <Form.Item
            name="equipment_id"
            label="Inventory asset"
            rules={[{ required: true, message: 'Choose the equipment record of this device.' }]}
            extra="The device's record in Equipment (register it there first, e.g. under Networking)."
          >
            <EquipmentSelect />
          </Form.Item>
        </div>

        {/* Step 2: location and network -------------------------------------------------------- */}
        <div hidden={step !== 1}>
          <Form.Item
            name="location"
            label="Installed at"
            rules={[{ required: true, message: 'Choose where the device physically is.' }]}
            extra="A station, the room itself, a bench or an equipment item. The room's gateway reads devices installed in that room."
          >
            <TargetPicker />
          </Form.Item>
          <Space.Compact block>
            <Form.Item
              name="network_host"
              label="IP address"
              style={{ flex: 3 }}
              rules={[
                { required: true, message: 'Enter the fixed IP address (DHCP reservation) of the device.' },
                { validator: (_, value) => (!value || isNetworkHost(value) ? Promise.resolve() : Promise.reject(new Error('Enter an IP address or host name.'))) },
              ]}
            >
              <Input placeholder="192.168.50.21" autoComplete="off" />
            </Form.Item>
            <Form.Item name="port" label="Port" style={{ flex: 1, marginLeft: 12 }} rules={[{ required: true }]}>
              <InputNumber min={1} max={65535} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>

          {mode !== 'native' && (
            <>
              <Space size={24} wrap align="start">
                <Form.Item name="serial_interface" label="Sensor bus">
                  <Segmented options={[{ value: 'rs485', label: 'RS485' }, { value: 'rs232', label: 'RS232' }]} />
                </Form.Item>
                <Form.Item name="serial_preset" label="Serial settings" extra="Must match the device's own web page and every sensor on the bus.">
                  <Segmented
                    options={[...SERIAL_PRESETS.map((preset) => ({ value: preset.key, label: preset.label })), { value: 'custom', label: 'Custom' }]}
                    onChange={(key) => {
                      const preset = SERIAL_PRESETS.find((item) => item.key === key);
                      if (preset) form.setFieldsValue({ baud_rate: preset.baud_rate, parity: preset.parity, data_bits: preset.data_bits, stop_bits: preset.stop_bits });
                    }}
                  />
                </Form.Item>
              </Space>
              <div hidden={values?.serial_preset !== 'custom'}>
                <Space size={12} wrap>
                  <Form.Item name="baud_rate" label="Baud rate" rules={[{ required: true }]}>
                    <Select style={{ width: 120 }} options={[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((rate) => ({ value: rate, label: rate }))} />
                  </Form.Item>
                  <Form.Item name="parity" label="Parity">
                    <Select style={{ width: 110 }} options={[{ value: 'N', label: 'None' }, { value: 'E', label: 'Even' }, { value: 'O', label: 'Odd' }]} />
                  </Form.Item>
                  <Form.Item name="data_bits" label="Data bits">
                    <Select style={{ width: 90 }} options={[7, 8].map((bits) => ({ value: bits, label: bits }))} />
                  </Form.Item>
                  <Form.Item name="stop_bits" label="Stop bits">
                    <Select style={{ width: 90 }} options={[1, 2].map((bits) => ({ value: bits, label: bits }))} />
                  </Form.Item>
                </Space>
              </div>
            </>
          )}
          <Collapse
            ghost
            size="small"
            items={[{
              key: 'advanced',
              label: 'Advanced',
              children: (
                <Space size={24} wrap align="start">
                  <Form.Item name="framing" label="Protocol on the network" extra="Use RTU over TCP only if the converter's gateway mode misbehaves.">
                    <Select style={{ width: 240 }} options={[{ value: 'mbap', label: 'Modbus TCP (gateway mode)' }, { value: 'rtu_over_tcp', label: 'Modbus RTU over TCP' }]} />
                  </Form.Item>
                  <Form.Item name="request_timeout_ms" label="Timeout (ms)">
                    <InputNumber min={50} max={30000} step={100} />
                  </Form.Item>
                  {mode !== 'native' && (
                    <Form.Item name="has_shared_bus" label="One request at a time" valuePropName="checked" extra="RS485 is half-duplex; keep on.">
                      <Switch />
                    </Form.Item>
                  )}
                </Space>
              ),
            }]}
          />
        </div>

        {/* Step 3: sensors --------------------------------------------------------------------- */}
        <div hidden={step !== 2}>
          <Typography.Paragraph type="secondary">
            Add each meter or probe on this device's bus. A device profile says how to read that model; the
            measurements are linked to what they measure (the install location by default). You can add sensors later.
          </Typography.Paragraph>
          {!profilesLoading && profileOptions.length === 0 && (
            <InlineAlert
              variant="warning"
              style={{ marginBottom: 12 }}
              title="No approved device profile yet"
              description="Create one under Telemetry › Device profiles and ask a lab administrator to approve it after the bench test."
            />
          )}
          {duplicates.length > 0 && (
            <InlineAlert
              variant="error"
              style={{ marginBottom: 12 }}
              title={`Duplicate Modbus address: ${duplicates.join(', ')}`}
              description="Each sensor on one bus requires a unique address."
            />
          )}
          <Form.List name="sensors">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '96px 1.2fr 1.6fr 1fr 32px', gap: 8, alignItems: 'start' }}>
                    <Form.Item name={[name, 'unit_id']} label={name === 0 ? 'Address' : undefined} rules={[{ required: true, message: '1–247' }]}>
                      <InputNumber min={1} max={247} placeholder="1" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={[name, 'profile_id']} label={name === 0 ? 'Device profile' : undefined} rules={[{ required: true, message: 'Choose a profile' }]}>
                      <Select
                        placeholder="e.g. DDSU666"
                        loading={profilesLoading}
                        options={profileOptions}
                        optionRender={(option) => (
                          <Space direction="vertical" size={0}>
                            <span>{option.data.label}</span>
                            <span style={{ fontSize: 12, color: 'var(--lm-text-tertiary)' }}>{option.data.metrics.join(', ')}</span>
                          </Space>
                        )}
                      />
                    </Form.Item>
                    <Form.Item name={[name, 'measures']} label={name === 0 ? 'Measures' : undefined} extra={name === fields.length - 1 ? 'Empty = the install location.' : undefined}>
                      <TargetPicker types={['station', 'room', 'bench', 'equipment']} placeholder={location ? `${location.name ?? 'Install location'}` : 'Install location'} />
                    </Form.Item>
                    <Form.Item name={[name, 'label']} label={name === 0 ? 'Label' : undefined}>
                      <Input placeholder="Main feed" maxLength={120} />
                    </Form.Item>
                    <Button
                      aria-label="Remove sensor"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      style={{ marginTop: name === 0 ? 30 : 0 }}
                    />
                  </div>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ unit_id: (fields.length || 0) + 1 })} block>
                  Add sensor
                </Button>
              </>
            )}
          </Form.List>
        </div>

        {/* Step 4: review ---------------------------------------------------------------------- */}
        {step === 3 && values && (
          <>
            <Descriptions
              size="small"
              bordered
              column={2}
              items={[
                { key: 'uid', label: 'Device', children: `${normalizeDeviceUid(values.device_uid ?? '')}${values.model ? ` · ${values.model}` : ''}` },
                { key: 'type', label: 'Type', children: values.mode === 'native' ? 'Native Modbus TCP device' : 'Serial-to-network converter' },
                { key: 'location', label: 'Installed at', children: values.location ? `${TARGET_TYPE_LABEL[values.location.type]} · ${values.location.name ?? values.location.id}` : '—' },
                { key: 'address', label: 'Address', children: `${values.network_host}:${values.port}` },
                ...(values.mode !== 'native'
                  ? [{ key: 'serial', label: 'Sensor bus', children: `${values.serial_interface?.toUpperCase()} ${values.baud_rate} ${values.data_bits}${values.parity}${values.stop_bits}` }]
                  : []),
              ]}
            />
            <Typography.Title level={5} style={{ marginTop: 20 }}>Sensors</Typography.Title>
            {(values.sensors ?? []).filter((row) => row?.unit_id && row.profile_id).length === 0 ? (
              <Typography.Text type="secondary">No sensors yet. You can add them from the device page.</Typography.Text>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {(values.sensors ?? []).filter((row) => row?.unit_id && row.profile_id).map((row) => {
                  const profile = profileOptions.find((option) => option.value === row.profile_id);
                  const target = row.measures ?? values.location;
                  return (
                    <div key={`${row.unit_id}-${row.profile_id}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Tag>Address {row.unit_id}</Tag>
                      <span>{profile?.label}</span>
                      <span style={{ color: 'var(--lm-text-tertiary)' }}>→ {target ? `${TARGET_TYPE_LABEL[target.type]} ${target.name ?? ''}` : '—'}</span>
                      <span style={{ color: 'var(--lm-text-tertiary)', marginLeft: 'auto' }}>{profile?.metrics.join(', ')}</span>
                    </div>
                  );
                })}
              </Space>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
}

export default AddDeviceWizard;
