import { useEffect, useMemo, useState } from 'react';
import { Button, Collapse, Dropdown, Modal, Popconfirm, Radio, Space, Table, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CloudServerOutlined, MoreOutlined, PlusOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { AgentIdentityRead, EnrollmentGrantRead } from '@/shared/api/generated/api';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { userLabel } from '@/shared/utils/userRef';
import {
  agentErrorMessage,
  useGetAgentGrantsQuery,
  useGetComputingAgentsQuery,
  useIssueAgentGrantMutation,
  useReissueAgentGrantMutation,
  useRetireAgentMutation,
  useRevokeAgentGrantMutation,
} from './agentApi';
import { GRANT_TONE, agentHealthHint, agentHealthTone, currentAgent, isLive, shortUid } from './agentModel';
import { AgentEnrollmentPanel, type IssuedGrant } from './AgentEnrollmentPanel';
import styles from './ComputingAgent.module.css';

dayjs.extend(relativeTime);

export interface AgentComputer {
  id: number;
  uid?: string;
  name?: string | null;
  sku?: string | null;
}

const formatTime = (value: string | null | undefined) => (value ? dayjs(value).format('MMM D, YYYY HH:mm') : '—');
const Relative = ({ value }: { value: string | null | undefined }) =>
  value ? <Tooltip title={formatTime(value)}><span>{dayjs(value).fromNow()}</span></Tooltip> : <span>—</span>;

const TTL_OPTIONS = [5, 15, 30, 60];
type GrantDialog = null | 'setup' | 'reissue' | 'recover';

/**
 * Compact agent dialog for one computing unit: health, identity, enrollment and history, with the
 * coordinator actions. Render with `key={computer?.id}` so the in-memory grant is forgotten when
 * the dialog closes or moves to another computer.
 */
export function ComputingAgentDialog({ computer, canManage, onClose }: {
  computer: AgentComputer | null;
  canManage: boolean;
  onClose: () => void;
}) {
  const open = computer !== null;
  const [issued, setIssued] = useState<IssuedGrant | null>(null);
  const [grantDialog, setGrantDialog] = useState<GrantDialog>(null);
  const [ttl, setTtl] = useState(15);

  const agentsArgs = { equipmentIds: computer ? [computer.id] : [] };
  const agentsQuery = useGetComputingAgentsQuery(agentsArgs, { skip: !open, pollingInterval: 20000, skipPollingIfUnfocused: true });
  const agents = useMemo(() => agentsQuery.data?.data ?? [], [agentsQuery.data]);
  const agent = currentAgent(agents);
  const previous = agents.filter((row) => row.id !== agent?.id);
  const grantsQuery = useGetAgentGrantsQuery({ agentId: agent?.id ?? 0 }, { skip: !open || !agent });

  const [issueGrant, issueState] = useIssueAgentGrantMutation();
  const [reissueGrant, reissueState] = useReissueAgentGrantMutation();
  const [revokeGrant] = useRevokeAgentGrantMutation();
  const [retireAgent] = useRetireAgentMutation();

  const state = agent?.state.value;
  const enrolling = state === 'pending' || (state === 'active' && !agent?.last_seen_at)
    || (issued !== null && agent?.agent_uid === issued.agentUid);
  // A second subscription to the same cache entry polls quickly while an enrollment is in flight, so
  // the checklist advances on its own (RTK Query polls at the shortest interval of its subscribers).
  useGetComputingAgentsQuery(agentsArgs, { skip: !open || !enrolling, pollingInterval: 4000, skipPollingIfUnfocused: true });
  // Grant statuses change when the device redeems a grant; refresh them whenever the agent moves on.
  const { refetch: refetchGrants } = grantsQuery;
  const grantsKey = agent ? `${agent.id}:${agent.state.value}:${agent.enrolled_at ?? ''}:${agent.last_seen_at ? 1 : 0}` : '';
  useEffect(() => { if (grantsKey) refetchGrants(); }, [grantsKey, refetchGrants]);

  const submitGrant = async () => {
    try {
      const response = grantDialog === 'setup'
        ? await issueGrant({ equipmentUid: computer?.uid ?? '', ttlMinutes: ttl }).unwrap()
        : await reissueGrant({ agentId: agent?.id ?? 0, ttlMinutes: ttl }).unwrap();
      setIssued({ agentUid: response.data.agent_uid, grant: response.data.grant, expiresAt: response.data.expires_at });
      setGrantDialog(null);
      message.success('Enrollment grant issued');
    } catch (error) {
      message.error(agentErrorMessage(error, 'Unable to issue an enrollment grant'));
    }
  };

  const confirmRetire = (action: 'revoke' | 'decommission') => {
    if (!agent) return;
    Modal.confirm({
      title: action === 'revoke' ? 'Revoke agent?' : 'Decommission agent?',
      content: action === 'revoke' ? 'Its key stops working immediately.' : 'Use when the computer leaves service.',
      okText: action === 'revoke' ? 'Revoke' : 'Decommission',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await retireAgent({ agentId: agent.id, action }).unwrap();
          message.success(action === 'revoke' ? 'Agent revoked' : 'Agent decommissioned');
        } catch (error) {
          message.error(agentErrorMessage(error, `Unable to ${action} the agent`));
        }
      },
    });
  };

  const grantColumns: ColumnsType<EnrollmentGrantRead> = [
    { title: 'Grant', key: 'status', width: 110, render: (_, row) => <StatusBadge tone={GRANT_TONE[row.status.value] ?? 'neutral'} label={row.status.label} fit /> },
    { title: 'Issued', key: 'created_at', render: (_, row) => <Tooltip title={userLabel(row.created_by) || undefined}><span><Relative value={row.created_at} /></span></Tooltip> },
    { title: 'Closed', key: 'closed', render: (_, row) => <Relative value={row.used_at ?? row.revoked_at ?? row.expires_at} /> },
    ...(canManage ? [{
      title: '',
      key: 'actions',
      width: 64,
      render: (_: unknown, row: EnrollmentGrantRead) => row.status.value === 'usable' && agent ? (
        <Popconfirm
          title="Revoke this grant?"
          onConfirm={async () => {
            try {
              await revokeGrant({ agentId: agent.id, grantId: row.id }).unwrap();
              if (issued?.agentUid === agent.agent_uid) setIssued(null);
              message.success('Grant revoked');
            } catch (error) {
              message.error(agentErrorMessage(error, 'Unable to revoke the grant'));
            }
          }}
        >
          <Button size="small" type="link" danger style={{ padding: 0 }}>Revoke</Button>
        </Popconfirm>
      ) : null,
    }] : []),
  ];

  const previousColumns: ColumnsType<AgentIdentityRead> = [
    { title: 'Previous agent', key: 'uid', render: (_, row) => <Tooltip title={row.agent_uid}><span className={styles.mono}>{shortUid(row.agent_uid)}</span></Tooltip> },
    { title: 'State', key: 'state', width: 130, render: (_, row) => <StatusBadge status={row.state.value} label={row.state.label} fit /> },
    { title: 'Retired', key: 'updated', render: (_, row) => <Relative value={row.updated_at} /> },
  ];

  const title = computer ? computer.sku || computer.name || `Computer #${computer.id}` : '';
  const live = agent ? isLive(agent) : false;
  const primaryAction = !canManage ? null : !live ? (
    <Button type="primary" size="small" icon={<PlusOutlined />} disabled={!computer?.uid} onClick={() => setGrantDialog('setup')}>Set up</Button>
  ) : state === 'pending' ? (
    <Button size="small" icon={<SyncOutlined />} onClick={() => setGrantDialog('reissue')}>New grant</Button>
  ) : null;
  const menuItems = canManage && state === 'active' ? [
    { key: 'recover', label: 'Re-enroll…', onClick: () => setGrantDialog('recover') },
    { type: 'divider' as const },
    { key: 'revoke', label: 'Revoke…', danger: true, onClick: () => confirmRetire('revoke') },
    { key: 'decommission', label: 'Decommission…', danger: true, onClick: () => confirmRetire('decommission') },
  ] : [];

  const historyCount = (grantsQuery.data?.data.length ?? 0) + previous.length;
  const statusLabel = agentsQuery.isError ? 'Unavailable' : agent?.health?.label ?? (agentsQuery.isLoading ? 'Loading' : 'No agent');

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnHidden
      rootClassName={styles.dialog}
      title={(
        <Space size={6}>
          <CloudServerOutlined />
          {title}
          <Tooltip title="Refresh">
            <Button size="small" type="text" aria-label="Refresh" icon={<ReloadOutlined />} loading={agentsQuery.isFetching} onClick={() => { agentsQuery.refetch(); if (agent) grantsQuery.refetch(); }} />
          </Tooltip>
        </Space>
      )}
    >
      <div className={styles.stack}>
        <div className={styles.summary}>
          <Tooltip title={agent ? agentHealthHint(agent.health?.value) : undefined}>
            <span>
              <StatusBadge tone={agentsQuery.isError ? 'danger' : agent ? agentHealthTone(agent.health?.value) : 'neutral'} label={statusLabel} fit />
            </span>
          </Tooltip>
          <span className={styles.summaryMeta}>
            {agent?.last_seen_at ? <>Seen <Relative value={agent.last_seen_at} /></> : null}
            {agent?.agent_version ? <> · v{agent.agent_version}</> : null}
            {!agent && !agentsQuery.isLoading && !agentsQuery.isError ? (canManage ? 'Not set up yet' : 'Ask a coordinator to set it up') : null}
          </span>
          {primaryAction}
          {menuItems.length > 0 && (
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
              <Button size="small" icon={<MoreOutlined />} aria-label="Agent actions" />
            </Dropdown>
          )}
        </div>

        {agent && enrolling && (
          <AgentEnrollmentPanel agent={agent} issued={issued} canManage={canManage} onNewGrant={() => setGrantDialog('reissue')} />
        )}

        {agent && (
          <dl className={styles.facts}>
            <dt>Agent UID</dt>
            <dd><Typography.Text className={styles.mono} copyable={{ text: agent.agent_uid }}>{agent.agent_uid}</Typography.Text></dd>
            <dt>State</dt>
            <dd>{agent.state.label}</dd>
            {agent.key_algorithm && (<><dt>Key</dt><dd>{agent.key_algorithm.label}{agent.key_storage ? ` · ${agent.key_storage.label}` : ''}</dd></>)}
            {agent.fingerprint && (<><dt>Fingerprint</dt><dd><Typography.Text className={styles.mono} copyable={{ text: agent.fingerprint }}>{agent.fingerprint}</Typography.Text></dd></>)}
            {agent.enrolled_at && (<><dt>Enrolled</dt><dd>{formatTime(agent.enrolled_at)}</dd></>)}
          </dl>
        )}

        {agent && historyCount > 0 && (
          <Collapse
            ghost
            size="small"
            className={styles.history}
            items={[{
              key: 'history',
              label: `History (${historyCount})`,
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Table<EnrollmentGrantRead> size="small" rowKey="id" pagination={false} columns={grantColumns} dataSource={grantsQuery.data?.data ?? []} />
                  {previous.length > 0 && (
                    <Table<AgentIdentityRead> size="small" rowKey="id" pagination={false} columns={previousColumns} dataSource={previous} />
                  )}
                </Space>
              ),
            }]}
          />
        )}
      </div>

      <Modal
        open={grantDialog !== null}
        width={400}
        title={grantDialog === 'setup' ? 'Set up agent' : grantDialog === 'recover' ? 'Re-enroll agent' : 'New enrollment grant'}
        okText="Issue grant"
        okButtonProps={{ danger: grantDialog === 'recover' }}
        confirmLoading={issueState.isLoading || reissueState.isLoading}
        onOk={submitGrant}
        onCancel={() => setGrantDialog(null)}
        destroyOnHidden
      >
        {grantDialog === 'recover' && (
          <Typography.Paragraph type="danger">The current agent stops working until the computer enrolls again.</Typography.Paragraph>
        )}
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Grant valid for</Typography.Text>
        <Radio.Group
          optionType="button"
          value={ttl}
          onChange={(event) => setTtl(event.target.value as number)}
          options={TTL_OPTIONS.map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
        />
      </Modal>
    </Modal>
  );
}

export default ComputingAgentDialog;
