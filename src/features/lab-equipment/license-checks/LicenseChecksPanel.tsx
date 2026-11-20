import { useState } from 'react';
import { Alert, Badge, Button, Drawer, Empty, Input, Popconfirm, Switch, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { LicenseCheckRead } from '@/shared/api/generated/api';
import {
  useDeleteLicenseCheckMutation,
  useGetLicenseCheckRunsQuery,
  useGetLicenseChecksQuery,
  useUpdateLicenseCheckMutation,
} from './api';
import { CheckFormModal } from './CheckFormModal';
import { probeSummary, runTone } from './presentation';
import styles from './LicenseChecks.module.css';

const TONE_COLORS = { success: 'green', warning: 'gold', error: 'red', processing: 'blue', default: 'default' } as const;

function RunsDrawer({ check, onClose }: { check: LicenseCheckRead | null; onClose: () => void }) {
  const { data, isFetching, isError, refetch } = useGetLicenseCheckRunsQuery(check?.id ?? 0, { skip: !check });
  return (
    <Drawer open={Boolean(check)} onClose={onClose} title={check ? `Runs of ${check.name}` : ''} width={720}>
      {isError && <Alert type="warning" showIcon title="Runs could not be loaded" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>} />}
      <Table
        rowKey="id"
        size="small"
        loading={isFetching}
        dataSource={data ?? []}
        pagination={false}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No computer has reported this check yet" /> }}
        columns={[
          { title: 'Computer', key: 'computing', render: (_, run) => run.computing.name },
          {
            title: 'Result',
            key: 'status',
            render: (_, run) => (
              <div className={styles.stack}>
                <Tag color={TONE_COLORS[runTone(run.status.value)]}>{run.status.label}</Tag>
                {run.error_message && <span className={styles.muted}>{run.error_code}: {run.error_message}</span>}
                {!run.is_applied && <span className={styles.muted}>Older revision or sequence: not applied</span>}
              </div>
            ),
          },
          { title: 'Licenses', dataIndex: 'license_count', key: 'license_count', width: 90 },
          { title: 'Revision', dataIndex: 'revision', key: 'revision', width: 90 },
          {
            title: 'Received',
            key: 'received_at',
            render: (_, run) => <Tooltip title={`${run.duration_ms} ms`}>{dayjs(run.received_at).format('DD MMM YYYY, HH:mm')}</Tooltip>,
          },
        ]}
      />
    </Drawer>
  );
}

/**
 * License checks configured for the lab's agents: what each runs, where, and what it found.
 * Creating and deleting checks needs license_check.manage; without it, checks can be enabled and retargeted.
 */
export function LicenseChecksPanel({
  canManageLicenseChecks,
  onShowFound,
}: {
  canManageLicenseChecks: boolean;
  onShowFound: (checkId: number) => void;
}) {
  const [q, setQ] = useState('');
  const { data, isFetching, isError, refetch } = useGetLicenseChecksQuery({ q });
  const [update] = useUpdateLicenseCheckMutation();
  const [remove] = useDeleteLicenseCheckMutation();
  const [editing, setEditing] = useState<LicenseCheckRead | null>(null);
  const [creating, setCreating] = useState(false);
  const [runsOf, setRunsOf] = useState<LicenseCheckRead | null>(null);

  const toggle = async (check: LicenseCheckRead, isEnabled: boolean) => {
    try {
      await update({ checkId: check.id, changes: { is_enabled: isEnabled } }).unwrap();
      message.success(isEnabled ? 'Check enabled' : 'Check disabled');
    } catch {
      message.error('Could not change the check');
    }
  };

  const columns: ColumnsType<LicenseCheckRead> = [
    {
      title: 'Check',
      key: 'name',
      render: (_, check) => (
        <div className={styles.stack}>
          <strong>{check.name}</strong>
          <span className={styles.mono}>{check.key}</span>
          {check.vendor && <span className={styles.muted}>{check.vendor}</span>}
        </div>
      ),
    },
    {
      title: 'Reads',
      key: 'probe',
      render: (_, check) => <span className={styles.mono}>{probeSummary(check.probe)}</span>,
    },
    {
      title: 'Runs on',
      key: 'targets',
      render: (_, check) => check.is_lab_wide ? <Tag color="purple">Every computer</Tag> : check.targets.length === 0
        ? <span className={styles.muted}>Nowhere yet</span>
        : (
          <div className={styles.tags}>
            {check.targets.map((target) => <Tag key={`${target.kind.value}:${target.id}`}>{target.kind.label}: {target.name}</Tag>)}
          </div>
        ),
    },
    {
      title: 'Found',
      key: 'found',
      width: 140,
      render: (_, check) => (
        <Button type="link" size="small" onClick={() => onShowFound(check.id)} style={{ paddingInline: 0 }}>
          <Badge count={check.attention_count} size="small" offset={[8, 0]} title={`${check.attention_count} need attention`}>
            <span>{check.license_count} {check.license_count === 1 ? 'license' : 'licenses'}</span>
          </Badge>
        </Button>
      ),
    },
    {
      title: 'Expected',
      key: 'expected',
      render: (_, check) => check.expected_licenses.length === 0 ? <span className={styles.muted}>—</span> : (
        <div className={styles.tags}>
          {check.expected_licenses.map((item) => (
            <Tag key={item.id} color={item.is_found ? 'green' : 'red'} title={item.is_found ? 'Found by a current run' : 'Not found on any computer'}>
              {item.is_found ? '' : 'Missing: '}{item.name}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Every',
      key: 'interval',
      width: 90,
      render: (_, check) => (check.interval_minutes % 60 === 0 ? `${check.interval_minutes / 60} h` : `${check.interval_minutes} min`),
    },
    {
      title: 'Enabled',
      key: 'enabled',
      width: 90,
      render: (_, check) => <Switch size="small" checked={check.is_enabled} onChange={(value) => void toggle(check, value)} aria-label={`Enable ${check.name}`} />,
    },
    {
      title: '',
      key: 'actions',
      width: 210,
      render: (_, check) => (
        <div className={styles.toolbarGroup}>
          <Button size="small" onClick={() => setRunsOf(check)}>Runs</Button>
          <Button size="small" onClick={() => setEditing(check)}>Edit</Button>
          {canManageLicenseChecks && (
            <Popconfirm
              title="Delete this check?"
              description="Agents stop running it, and its runs and found licenses are deleted. Licenses in the inventory stay."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={() => remove(check.id).unwrap().then(() => message.success('Check deleted')).catch(() => message.error('Could not delete'))}
            >
              <Button size="small" danger>Delete</Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.panel}>
      <p className={styles.intro}>
        Agents on the targeted computers run these checks read-only, find the licenses on the computer and on hardware connected
        to it (for example a CANcase), and report them. A license whose serial number matches the inventory and whose carrier is at
        that computer gets its expiry date and maximum version updated automatically.
      </p>
      <div className={styles.toolbar}>
        <Input.Search allowClear placeholder="Name, key or vendor" onSearch={setQ} style={{ maxWidth: 320 }} aria-label="Search checks" />
        {canManageLicenseChecks && <Button type="primary" onClick={() => setCreating(true)}>New check</Button>}
      </div>
      {isError && <Alert type="warning" showIcon title="License checks could not be loaded" action={<Button size="small" onClick={() => void refetch()}>Retry</Button>} />}
      <Table
        rowKey="id"
        size="middle"
        loading={isFetching}
        columns={columns}
        dataSource={data?.data ?? []}
        pagination={false}
        scroll={{ x: 1000 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={canManageLicenseChecks ? 'No license check yet. Start from the Vector License Client preset.' : 'No license check yet. An administrator can add one.'}
            />
          ),
        }}
      />
      <CheckFormModal open={creating || Boolean(editing)} check={editing ?? undefined} canManageLicenseChecks={canManageLicenseChecks} onClose={() => { setCreating(false); setEditing(null); }} />
      <RunsDrawer check={runsOf} onClose={() => setRunsOf(null)} />
    </div>
  );
}
