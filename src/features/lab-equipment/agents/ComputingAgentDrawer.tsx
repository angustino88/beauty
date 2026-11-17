import { useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Modal, Popconfirm, Radio, Space, Table, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ApiOutlined, CloudServerOutlined, PlusOutlined, ReloadOutlined, StopOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { AgentIdentityRead, EnrollmentGrantRead } from '@/shared/api/generated/api';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { DetailSection, PropertyList, StatusHero } from '@/shared/components/detail/DetailPrimitives';
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
const Copyable = ({ value }: { value: string | null | undefined }) =>
  value ? <Typography.Text className={styles.mono} copyable={{ text: value }}>{value}</Typography.Text> : <span>—</span>;

const TTL_OPTIONS = [5, 15, 30, 60];

/**
 * Render with `key={computer?.id}` so the in-memory grant is forgotten when the drawer closes or
 * moves to another computer.
 *
 * Agent of one computing unit: health, identity, enrollment and grant history, with the
 * coordinator actions (set up, re-enroll, revoke grant, revoke or decommission the agent).
 */
export function ComputingAgentDrawer({ computer, canManage, onClose }: {
  computer: AgentComputer | null;
  canManage: boolean;
  onClose: () => void;
}) {
  const open = computer !== null;
  const [issued, setIssued] = useState<IssuedGrant | null>(null);
  const [grantDialog, setGrantDialog] = useState<null | 'setup' | 'reissue' | 'recover'>(null);
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
  const [retireAgent, retireState] = useRetireAgentMutation();

  const enrolling = agent?.state.value === 'pending' || (agent?.state.value === 'active' && !agent.last_seen_at)
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

  const retire = async (action: 'revoke' | 'decommission') => {
    if (!agent) return;
    try {
      await retireAgent({ agentId: agent.id, action }).unwrap();
      message.success(action === 'revoke' ? 'Agent revoked' : 'Agent decommissioned');
    } catch (error) {
      message.error(agentErrorMessage(error, `Unable to ${action} the agent`));
    }
  };

  const grantColumns: ColumnsType<EnrollmentGrantRead> = [
    { title: 'Status', key: 'status', width: 120, render: (_, row) => <StatusBadge tone={GRANT_TONE[row.status.value] ?? 'neutral'} label={row.status.label} /> },
    { title: 'Issued', key: 'created_at', render: (_, row) => <Relative value={row.created_at} /> },
    { title: 'Issued by', key: 'created_by', render: (_, row) => userLabel(row.created_by) || '—' },
    {
      title: 'Expires / closed',
      key: 'closed',
      render: (_, row) => <Relative value={row.used_at ?? row.revoked_at ?? row.expires_at} />,
    },
    ...(canManage ? [{
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, row: EnrollmentGrantRead) => row.status.value === 'usable' && agent ? (
        <Popconfirm
          title="Revoke this grant?"
          description={agent.state.value === 'pending' ? 'If it is the last usable grant, the pending agent is revoked too.' : undefined}
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
          <Button size="small" type="link" danger>Revoke</Button>
        </Popconfirm>
      ) : null,
    }] : []),
  ];

  const previousColumns: ColumnsType<AgentIdentityRead> = [
    { title: 'Agent UID', key: 'uid', render: (_, row) => <Tooltip title={row.agent_uid}><span className={styles.mono}>{shortUid(row.agent_uid)}</span></Tooltip> },
    { title: 'State', key: 'state', width: 140, render: (_, row) => <StatusBadge status={row.state.value} label={row.state.label} /> },
    { title: 'Version', dataIndex: 'agent_version', render: (value: string) => value || '—' },
    { title: 'Enrolled', key: 'enrolled', render: (_, row) => formatTime(row.enrolled_at) },
    { title: 'Retired', key: 'updated', render: (_, row) => formatTime(row.updated_at) },
  ];

  const health = agent?.health;
  const title = computer ? [computer.sku, computer.name].filter(Boolean).join(' — ') || `Computer #${computer.id}` : '';
  const live = agent ? isLive(agent) : false;

  const heroAction = !canManage ? null : !live ? (
    <Button type="primary" icon={<PlusOutlined />} disabled={!computer?.uid} onClick={() => setGrantDialog('setup')}>
      Set up agent
    </Button>
  ) : agent?.state.value === 'pending' ? (
    <Button icon={<SyncOutlined />} onClick={() => setGrantDialog('reissue')}>New grant</Button>
  ) : (
    <Button icon={<SyncOutlined />} onClick={() => setGrantDialog('recover')}>Re-enroll</Button>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={760}
      destroyOnHidden
      title={<Space><CloudServerOutlined />Agent · {title}</Space>}
      extra={<Tooltip title="Refresh"><Button aria-label="Refresh" icon={<ReloadOutlined />} loading={agentsQuery.isFetching} onClick={() => { agentsQuery.refetch(); if (agent) grantsQuery.refetch(); }} /></Tooltip>}
    >
      <div className={styles.stack}>
        {agentsQuery.isError ? (
          <StatusHero tone="danger" title="Agent information is unavailable" description={agentErrorMessage(agentsQuery.error, 'The agent service did not respond.')} />
        ) : !agent && !agentsQuery.isLoading ? (
          <section className={`${styles.panel} ${styles.empty}`}>
            <ApiOutlined style={{ fontSize: 28, color: 'var(--lm-text-tertiary)' }} />
            <p className={styles.emptyTitle}>No agent on this computer</p>
            <p className={styles.emptyText}>
              The LabMango agent reports health, live sessions and booking check-ins. Setting it up issues a one-time
              enrollment grant; the agent creates its own key on the computer and proves it to the backend.
            </p>
            {canManage
              ? <Button type="primary" icon={<PlusOutlined />} disabled={!computer?.uid} onClick={() => setGrantDialog('setup')}>Set up agent</Button>
              : <Typography.Text type="secondary">Ask a lab coordinator to set up the agent.</Typography.Text>}
            {canManage && !computer?.uid && <p className={styles.panelHint}>This record has no equipment UID yet; reload the inventory.</p>}
          </section>
        ) : agent ? (
          <StatusHero
            tone={agentHealthTone(health?.value)}
            eyebrow="Agent health"
            title={health?.label ?? 'Unknown'}
            description={agentHealthHint(health?.value)}
            icon={<CloudServerOutlined />}
            aside={heroAction}
            facts={[
              { label: 'Last heartbeat', value: <Relative value={agent.last_seen_at} /> },
              { label: 'State', value: agent.state.label },
              { label: 'Version', value: agent.agent_version || '—' },
            ]}
          />
        ) : null}

        {agent && enrolling && (
          <AgentEnrollmentPanel agent={agent} issued={issued} canManage={canManage} onNewGrant={() => setGrantDialog('reissue')} />
        )}

        {agent && (
          <DetailSection title="Identity">
            <PropertyList
              items={[
                ['Agent UID', <Copyable key="uid" value={agent.agent_uid} />],
                ['Agent ID', agent.id],
                ['State', <StatusBadge key="state" status={agent.state.value} label={agent.state.label} fit />],
                ['Health', <StatusBadge key="health" tone={agentHealthTone(health?.value)} label={health?.label ?? 'Unknown'} fit />],
                ['Last heartbeat', formatTime(agent.last_seen_at)],
                ['Agent version', agent.agent_version || '—'],
                ['Key', agent.key_algorithm ? `${agent.key_algorithm.label}${agent.key_storage ? ` · ${agent.key_storage.label}` : ''}` : 'Not enrolled'],
                ['Device fingerprint', <Copyable key="fp" value={agent.fingerprint} />],
                ['Enrolled', formatTime(agent.enrolled_at)],
                ['Registered', formatTime(agent.created_at)],
              ]}
            />
          </DetailSection>
        )}

        {agent && (
          <DetailSection title="Enrollment grants">
            <Table<EnrollmentGrantRead>
              size="small"
              rowKey="id"
              pagination={false}
              loading={grantsQuery.isFetching && !grantsQuery.data}
              columns={grantColumns}
              dataSource={grantsQuery.data?.data ?? []}
              locale={{ emptyText: 'No grants issued' }}
            />
          </DetailSection>
        )}

        {previous.length > 0 && (
          <DetailSection title="Previous agents">
            <Table<AgentIdentityRead> size="small" rowKey="id" pagination={false} columns={previousColumns} dataSource={previous} />
          </DetailSection>
        )}

        {canManage && agent?.state.value === 'active' && (
          <section className={styles.danger} aria-label="Danger zone">
            <h3 className={styles.panelTitle} style={{ marginBottom: 12 }}>Danger zone</h3>
            <div className={styles.dangerRow}>
              <div className={styles.dangerText}>
                <strong>Revoke agent</strong>
                <span>Its key stops working at the next request. Use when the computer or key may be compromised.</span>
              </div>
              <Popconfirm title="Revoke this agent?" okButtonProps={{ danger: true }} onConfirm={() => retire('revoke')}>
                <Button danger icon={<StopOutlined />} loading={retireState.isLoading}>Revoke</Button>
              </Popconfirm>
            </div>
            <div className={styles.dangerRow}>
              <div className={styles.dangerText}>
                <strong>Decommission agent</strong>
                <span>Retire the agent when the computer leaves service or the agent is uninstalled.</span>
              </div>
              <Popconfirm title="Decommission this agent?" okButtonProps={{ danger: true }} onConfirm={() => retire('decommission')}>
                <Button danger loading={retireState.isLoading}>Decommission</Button>
              </Popconfirm>
            </div>
          </section>
        )}
      </div>

      <Modal
        open={grantDialog !== null}
        title={grantDialog === 'setup' ? 'Set up agent' : grantDialog === 'recover' ? 'Re-enroll agent' : 'Issue a new enrollment grant'}
        okText="Issue grant"
        okButtonProps={{ danger: grantDialog === 'recover' }}
        confirmLoading={issueState.isLoading || reissueState.isLoading}
        onOk={submitGrant}
        onCancel={() => setGrantDialog(null)}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {grantDialog === 'recover' && (
            <Typography.Paragraph type="danger" style={{ margin: 0 }}>
              The current agent stops working immediately and is offline until the computer enrolls again with the new grant.
            </Typography.Paragraph>
          )}
          {grantDialog === 'reissue' && (
            <Typography.Paragraph type="secondary" style={{ margin: 0 }}>Any unredeemed grant for this agent is revoked.</Typography.Paragraph>
          )}
          <Typography.Paragraph style={{ margin: 0 }}>
            A one-time grant lets the agent on <strong>{title}</strong> enroll. It is shown once; redeem it before it expires.
          </Typography.Paragraph>
          <div>
            <Typography.Text strong>Grant lifetime</Typography.Text>
            <div style={{ marginTop: 6 }}>
              <Radio.Group
                optionType="button"
                value={ttl}
                onChange={(event) => setTtl(event.target.value as number)}
                options={TTL_OPTIONS.map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
              />
            </div>
          </div>
        </Space>
      </Modal>
    </Drawer>
  );
}

export default ComputingAgentDrawer;
