import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { CheckCircleOutlined, CopyOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import {
  useApproveDeviceProfileMutation,
  useCreateDeviceProfileMutation,
  useGetDeviceProfilesQuery,
  useGetTelemetryMetricsQuery,
} from '../api';
import { readApiProblem } from '../errors';
import { PROFILE_STATUS_TONE } from '../format';
import type { DeviceProfile, ModbusReadEntry } from '../types';
import styles from './telemetry.module.css';

const REGISTER_TYPES = ['int16', 'uint16', 'int32', 'uint32', 'float32'] as const;
const WORDS: Record<(typeof REGISTER_TYPES)[number], number> = { int16: 1, uint16: 1, int32: 2, uint32: 2, float32: 2 };

interface MapRow extends ModbusReadEntry {
  metric: string;
}

interface EditorValues {
  key: string;
  manufacturer?: string;
  model?: string;
  notes?: string;
  rows: MapRow[];
}

const toRows = (profile?: DeviceProfile | null): MapRow[] =>
  profile
    ? Object.entries(profile.read_map).map(([metric, entry]) => ({ metric, ...entry }))
    : [{ metric: 'power_w', function_code: 3, register: 0, type: 'float32', word_order: 'big', scale: 1, offset: 0 }];

function ProfileEditor({ base, open, onClose }: { base: DeviceProfile | null; open: boolean; onClose: () => void }) {
  const [form] = Form.useForm<EditorValues>();
  const { data: metrics } = useGetTelemetryMetricsQuery(undefined, { skip: !open });
  const [create, state] = useCreateDeviceProfileMutation();
  const [problem, setProblem] = useState<string | null>(null);
  const rows = Form.useWatch('rows', form) as MapRow[] | undefined;

  const submit = async () => {
    const values = await form.validateFields();
    const seen = new Set<string>();
    for (const row of values.rows) {
      if (seen.has(row.metric)) {
        setProblem(`"${row.metric}" appears twice. Each measurement has one register entry.`);
        return;
      }
      seen.add(row.metric);
    }
    const read_map = Object.fromEntries(values.rows.map(({ metric, ...entry }) => [
      metric,
      { ...entry, words: WORDS[entry.type], ...(WORDS[entry.type] === 1 ? { word_order: undefined } : {}) },
    ]));
    setProblem(null);
    try {
      const saved = await create({
        key: values.key,
        protocol: 'modbus',
        manufacturer: values.manufacturer ?? '',
        model: values.model ?? '',
        notes: values.notes ?? '',
        read_map,
      }).unwrap();
      void message.success(`Saved ${saved.reference} as a draft. A lab admin approves it after the bench test.`);
      onClose();
    } catch (error) {
      const result = readApiProblem(error);
      setProblem([result.message, ...result.fields.map((field) => `${field.field}: ${field.message}`)].join(' '));
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => void submit()}
      okText={base ? 'Save new version' : 'Save draft'}
      confirmLoading={state.isLoading}
      width={1040}
      destroyOnHidden
      title={base ? `New version of ${base.key}` : 'New device profile'}
    >
      <Typography.Paragraph type="secondary">
        A device profile tells the gateway how to read one sensor model over Modbus: which register holds each
        measurement, its data type and scale. Take the values from the sensor's manual and confirm them in a bench test.
      </Typography.Paragraph>
      {problem && <Alert type="error" showIcon title={problem} style={{ marginBottom: 12 }} />}
      <Form<EditorValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{
          key: base?.key ?? '',
          manufacturer: base?.manufacturer ?? '',
          model: base?.model ?? '',
          notes: base?.notes ?? '',
          rows: toRows(base),
        }}
      >
        <Space.Compact block>
          <Form.Item
            name="key"
            label="Model code"
            style={{ flex: 1 }}
            rules={[{ required: true, pattern: /^[A-Za-z0-9_\- ]{1,64}$/, message: 'Letters, digits, - or _ (e.g. chint_ddsu666).' }]}
            extra="Saving an existing code creates the next version."
          >
            <Input placeholder="chint_ddsu666" disabled={Boolean(base)} />
          </Form.Item>
          <Form.Item name="manufacturer" label="Manufacturer" style={{ flex: 1, marginLeft: 12 }}>
            <Input placeholder="CHINT" />
          </Form.Item>
          <Form.Item name="model" label="Model" style={{ flex: 1, marginLeft: 12 }}>
            <Input placeholder="DDSU666" />
          </Form.Item>
        </Space.Compact>

        <Typography.Title level={5}>Register map</Typography.Title>
        <div className={styles.registerMap} style={{ color: 'var(--lm-text-tertiary)', fontSize: 12, marginBottom: 4 }}>
          <span>Measurement</span><span>Function</span><span>Register</span><span>Data type</span><span>Word order</span><span>Scale</span><span>Offset</span><span />
        </div>
        <Form.List name="rows">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => {
                const type = rows?.[name]?.type ?? 'int16';
                return (
                  <div key={key} className={styles.registerMap}>
                    <Form.Item name={[name, 'metric']} rules={[{ required: true, message: 'Choose' }]}>
                      <Select options={(metrics ?? []).map((metric) => ({ value: metric.key, label: `${metric.name} (${metric.unit})` }))} />
                    </Form.Item>
                    <Form.Item name={[name, 'function_code']} rules={[{ required: true }]}>
                      <Select options={[{ value: 3, label: '03 Holding' }, { value: 4, label: '04 Input' }]} />
                    </Form.Item>
                    <Form.Item
                      name={[name, 'register']}
                      rules={[{ required: true, message: '0–65535' }]}
                      extra={rows?.[name]?.register != null ? `0x${Number(rows[name].register).toString(16).toUpperCase().padStart(4, '0')}` : undefined}
                    >
                      <InputNumber min={0} max={65535} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={[name, 'type']} rules={[{ required: true }]}>
                      <Select options={REGISTER_TYPES.map((value) => ({ value, label: `${value} (${WORDS[value]} word${WORDS[value] > 1 ? 's' : ''})` }))} />
                    </Form.Item>
                    <Form.Item name={[name, 'word_order']}>
                      <Select disabled={WORDS[type] === 1} options={[{ value: 'big', label: 'Big' }, { value: 'little', label: 'Little' }]} />
                    </Form.Item>
                    <Form.Item name={[name, 'scale']} rules={[{ validator: (_, value) => (value === 0 ? Promise.reject(new Error('Not 0')) : Promise.resolve()) }]}>
                      <InputNumber step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={[name, 'offset']}>
                      <InputNumber step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Button type="text" aria-label="Remove row" icon={<DeleteOutlined />} disabled={fields.length === 1} onClick={() => remove(name)} />
                  </div>
                );
              })}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add({ function_code: 3, register: 0, type: 'int16', word_order: 'big', scale: 1, offset: 0 })}
              >
                Add measurement
              </Button>
            </>
          )}
        </Form.List>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
          Value = raw × scale + offset. Example: a temperature stored as 245 with scale 0.1 reads 24.5 °C.
        </Typography.Paragraph>
        <Form.Item name="notes" label="Bench test notes" extra="What was compared and against what, e.g. meter display under a 1 kW load.">
          <Input.TextArea rows={3} maxLength={4000} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function ProfileDrawer({ profile, onClose, canApprove, onNewVersion }: {
  profile: DeviceProfile | null;
  onClose: () => void;
  canApprove: boolean;
  onNewVersion: (profile: DeviceProfile) => void;
}) {
  const [approve, state] = useApproveDeviceProfileMutation();
  const rows = profile ? Object.entries(profile.read_map) : [];
  return (
    <Drawer
      open={profile !== null}
      onClose={onClose}
      width={760}
      title={profile && (
        <Space>
          <span>{profile.model || profile.key}</span>
          <Typography.Text type="secondary" style={{ fontWeight: 400 }}>{profile.reference}</Typography.Text>
          <StatusBadge tone={PROFILE_STATUS_TONE[profile.status.value]} label={profile.status.label} fit />
        </Space>
      )}
      extra={profile && (
        <Space>
          <Button icon={<CopyOutlined />} onClick={() => onNewVersion(profile)}>New version</Button>
          {profile.status.value === 'draft' && canApprove && (
            <Popconfirm
              title="Approve this profile?"
              description="Approve only after a bench test confirmed every register and scale. Channels can then use it."
              okText="Approve"
              onConfirm={() => approve(profile.id).unwrap().then(() => message.success('Profile approved')).catch((error) => message.error(readApiProblem(error).message))}
            >
              <Button type="primary" icon={<CheckCircleOutlined />} loading={state.isLoading}>Approve</Button>
            </Popconfirm>
          )}
        </Space>
      )}
    >
      {profile && (
        <>
          {profile.status.value === 'draft' && !canApprove && (
            <Alert type="info" showIcon style={{ marginBottom: 16 }} title="Draft: a lab admin approves it after the bench test. Until then it cannot be used by sensors." />
          )}
          <Descriptions
            size="small"
            column={2}
            items={[
              { key: 'manufacturer', label: 'Manufacturer', children: profile.manufacturer || '—' },
              { key: 'protocol', label: 'Protocol', children: profile.protocol.label },
              { key: 'used', label: 'Used by', children: `${profile.channel_count} measurement${profile.channel_count === 1 ? '' : 's'}` },
              { key: 'approved', label: 'Approved', children: profile.approved_at ? new Date(profile.approved_at).toLocaleString() : '—' },
              { key: 'notes', label: 'Bench test notes', span: 2, children: profile.notes || '—' },
            ]}
          />
          <Typography.Title level={5} style={{ marginTop: 20 }}>Register map</Typography.Title>
          <Table
            size="small"
            rowKey={([metric]) => metric}
            pagination={false}
            dataSource={rows}
            columns={[
              { title: 'Measurement', render: (_, [metric]) => metric },
              { title: 'Function', render: (_, [, entry]) => (entry.function_code === 4 ? '04 Input' : '03 Holding') },
              { title: 'Register', render: (_, [, entry]) => <span className={styles.mono}>{entry.register} · 0x{entry.register.toString(16).toUpperCase().padStart(4, '0')}</span> },
              { title: 'Type', render: (_, [, entry]) => `${entry.type}${entry.word_order && WORDS[entry.type] > 1 ? `, ${entry.word_order}` : ''}` },
              { title: 'Scale', render: (_, [, entry]) => entry.scale ?? 1 },
              { title: 'Offset', render: (_, [, entry]) => entry.offset ?? 0 },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}

export default function DeviceProfilesPage() {
  const groups = useSelector((state: RootState) => state.me.permissionGroups) as Record<string, unknown> | undefined;
  const canApprove = Boolean(groups && ('admin' in groups || 'administrator' in groups));
  const [status, setStatus] = useState<'all' | 'approved' | 'draft'>('all');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search, 400).trim() || undefined;
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetDeviceProfilesQuery({ status: status === 'all' ? undefined : status, q, page, page_size: 20 });
  const [viewing, setViewing] = useState<DeviceProfile | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [base, setBase] = useState<DeviceProfile | null>(null);
  const current = useMemo(() => (viewing ? data?.data.find((item) => item.id === viewing.id) ?? viewing : null), [data, viewing]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Device profiles"
        description="How to read each sensor model. A lab admin approves a profile once a bench test confirms it."
        controls={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setBase(null); setEditorOpen(true); }}>New profile</Button>}
      />
      <div className={styles.toolbar}>
        <Segmented
          value={status}
          options={[{ value: 'all', label: 'All' }, { value: 'approved', label: 'Approved' }, { value: 'draft', label: 'Drafts' }]}
          onChange={(value) => { setStatus(value as typeof status); setPage(1); }}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Code, manufacturer or model"
          style={{ width: 280, marginLeft: 'auto' }}
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
      </div>
      <Table<DeviceProfile>
        rowKey="id"
        loading={isFetching}
        dataSource={data?.data ?? []}
        onRow={(profile) => ({ onClick: () => setViewing(profile), style: { cursor: 'pointer' } })}
        pagination={{ current: page, pageSize: 20, total: data?.meta?.pagination?.count ?? 0, onChange: setPage }}
        columns={[
          {
            title: 'Model',
            key: 'model',
            render: (_, profile) => (
              <Space direction="vertical" size={0}>
                <span style={{ fontWeight: 500 }}>{profile.model || profile.key}</span>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{profile.manufacturer || '—'}</Typography.Text>
              </Space>
            ),
          },
          { title: 'Version', key: 'reference', render: (_, profile) => <span className={styles.mono}>{profile.reference}</span> },
          {
            title: 'Measurements',
            key: 'metrics',
            render: (_, profile) => <Space size={4} wrap>{Object.keys(profile.read_map).map((metric) => <Tag key={metric}>{metric}</Tag>)}</Space>,
          },
          { title: 'Status', key: 'status', width: 140, render: (_, profile) => <StatusBadge tone={PROFILE_STATUS_TONE[profile.status.value]} label={profile.status.label} /> },
          { title: 'Used by', dataIndex: 'channel_count', width: 100, align: 'right' },
        ]}
      />
      <ProfileDrawer
        profile={current}
        onClose={() => setViewing(null)}
        canApprove={canApprove}
        onNewVersion={(profile) => { setBase(profile); setEditorOpen(true); }}
      />
      <ProfileEditor base={base} open={editorOpen} onClose={() => setEditorOpen(false)} />
    </div>
  );
}
