import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Dropdown, Modal, Popconfirm, Spin, Tooltip, Typography, message } from 'antd';
import { CheckCircleFilled, DownOutlined, ExclamationCircleFilled, LaptopOutlined, PoweroffOutlined, StopOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { EnrollmentGrantRead } from '@/shared/api/generated/api';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { userLabel } from '@/shared/utils/userRef';
import { useAppDispatch } from '@/app/store';
import { usePermission } from '@/features/auth/hooks/useCan';
import {
  agentApi,
  agentErrorMessage,
  useGetAgentGrantsQuery,
  useGetComputingAgentsQuery,
  useIssueAgentGrantMutation,
  useReissueAgentGrantMutation,
  useRetireAgentMutation,
  useRevokeAgentGrantMutation,
} from './agentApi';
import { agentStatus, currentAgent, formatCountdown, isLive, setupPhase, shortUid, type AgentTone } from './agentModel';
import { AgentSetup, type IssuedGrant, type SetupMode } from './AgentSetup';
import { useCountdown } from './useCountdown';
import styles from './ComputingAgent.module.css';

dayjs.extend(relativeTime);

export interface AgentComputer {
  id: number;
  uid?: string;
  name?: string | null;
  sku?: string | null;
}

const formatTime = (value: string | null | undefined) => (value ? dayjs(value).format('MMM D, YYYY HH:mm') : '—');
const Ago = ({ value, never = 'Never' }: { value: string | null | undefined; never?: string }) =>
  value ? <Tooltip title={formatTime(value)}><span>{dayjs(value).fromNow()}</span></Tooltip> : <span>{never}</span>;
const Mono = ({ value }: { value: string }) => (
  <Typography.Text className={styles.mono} copyable={{ text: value, tooltips: ['Copy', 'Copied'] }}>{value}</Typography.Text>
);

const MenuChoice = ({ title, hint }: { title: string; hint: string }) => (
  <span className={styles.menuChoice}><span className={styles.menuTitle}>{title}</span><span className={styles.menuHint}>{hint}</span></span>
);

interface ActivityItem { key: string; at: string; tone: AgentTone; text: ReactNode; meta?: string; action?: ReactNode }

/**
 * Agent of one computing unit. The info view reads like a CI runner page (status, details,
 * activity); the setup view walks through Download, Configure and Verify while the footer reports
 * progress live. Render with `key={computer?.id}` so the in-memory grant is forgotten on close.
 */
export function ComputingAgentDialog({ computer, onClose }: {
  computer: AgentComputer | null;
  onClose: () => void;
}) {
  const canManageAgents = usePermission('agent.manage');
  const open = computer !== null;
  const [issued, setIssued] = useState<IssuedGrant | null>(null);
  const [view, setView] = useState<'auto' | 'info' | 'setup'>('auto');
  const [recovering, setRecovering] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  const agentsArgs = { equipmentIds: computer ? [computer.id] : [] };
  const agentsQuery = useGetComputingAgentsQuery(agentsArgs, { skip: !open, pollingInterval: 20000, skipPollingIfUnfocused: true });
  const agents = useMemo(() => agentsQuery.data?.data ?? [], [agentsQuery.data]);
  const agent = currentAgent(agents);
  const live = agent && isLive(agent) ? agent : undefined;
  const state = live?.state.value;
  const grantsQuery = useGetAgentGrantsQuery({ agentId: agent?.id ?? 0 }, { skip: !open || !agent });

  const [issueGrant, issueState] = useIssueAgentGrantMutation();
  const [reissueGrant, reissueState] = useReissueAgentGrantMutation();
  const [revokeGrant] = useRevokeAgentGrantMutation();
  const [retireAgent] = useRetireAgentMutation();

  const grant = issued && live && issued.agentUid === live.agent_uid ? issued : null;
  const remaining = useCountdown(grant?.expiresAt);
  const phase = setupPhase(live, { hasGrant: Boolean(grant), grantExpired: Boolean(grant) && remaining === 0 });
  const resolvedView = view !== 'auto' ? view : state === 'active' || !canManageAgents ? 'info' : 'setup';
  const settingUp = resolvedView === 'setup' && (phase === 'waiting' || phase === 'enrolled');

  // A second subscription polls quickly while a setup is in flight, so the footer advances on its
  // own (RTK Query polls at the shortest interval of its subscribers).
  useGetComputingAgentsQuery(agentsArgs, { skip: !open || !settingUp, pollingInterval: 4000, skipPollingIfUnfocused: true });
  // Grant statuses change when the device redeems a grant; refresh them whenever the agent moves on.
  const { refetch: refetchGrants } = grantsQuery;
  const grantsKey = agent ? `${agent.id}:${agent.state.value}:${agent.last_seen_at ? 1 : 0}` : '';
  // The inventory column caches its own agent list; refresh it when this agent changes state too.
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!grantsKey) return;
    refetchGrants();
    dispatch(agentApi.util.invalidateTags([{ type: 'Agent', id: 'LIST' }]));
  }, [grantsKey, refetchGrants, dispatch]);

  const setupMode: SetupMode = recovering && state === 'active' ? 'recover' : state === 'pending' ? 'reissue' : 'setup';
  const generate = async (ttlMinutes: number) => {
    try {
      const response = setupMode === 'setup'
        ? await issueGrant({ equipmentUid: computer?.uid ?? '', ttlMinutes }).unwrap()
        : await reissueGrant({ agentId: live?.id ?? 0, ttlMinutes }).unwrap();
      setIssued({ agentUid: response.data.agent_uid, grant: response.data.grant, expiresAt: response.data.expires_at });
      setRecovering(false);
      setView('setup');
    } catch (error) {
      message.error(agentErrorMessage(error, 'Unable to issue an enrollment grant'));
    }
  };

  const retire = (action: 'revoke' | 'decommission') => {
    if (!live) return;
    Modal.confirm({
      title: action === 'revoke' ? `Revoke the agent on ${computer?.sku ?? 'this computer'}?` : `Decommission the agent on ${computer?.sku ?? 'this computer'}?`,
      content: action === 'revoke'
        ? 'Its key stops working at the next request. Use this when the computer or its key may be compromised.'
        : 'Use this when the computer leaves service or the agent is uninstalled.',
      okText: action === 'revoke' ? 'Revoke agent' : 'Decommission agent',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await retireAgent({ agentId: live.id, action }).unwrap();
          message.success(action === 'revoke' ? 'Agent revoked' : 'Agent decommissioned');
        } catch (error) {
          message.error(agentErrorMessage(error, `Unable to ${action} the agent`));
        }
      },
    });
  };

  const activity = useMemo<ActivityItem[]>(() => {
    const grants = (grantsQuery.data?.data ?? []).map((row: EnrollmentGrantRead): ActivityItem => {
      const by = userLabel(row.created_by);
      const base = { key: `grant-${row.id}`, meta: by ? `by ${by}` : undefined };
      switch (row.status.value) {
        case 'redeemed': return { ...base, at: row.used_at ?? row.created_at, tone: 'success', text: 'Enrolled with a one-time grant' };
        case 'revoked': return { ...base, at: row.revoked_at ?? row.created_at, tone: 'neutral', text: 'Enrollment grant revoked' };
        case 'expired': return { ...base, at: row.expires_at, tone: 'neutral', text: 'Enrollment grant expired unused' };
        default: return {
          ...base,
          at: row.created_at,
          tone: 'info',
          text: <>Enrollment grant issued · expires <Ago value={row.expires_at} /></>,
          action: canManageAgents && live ? (
            <Popconfirm
              title="Revoke this grant?"
              okButtonProps={{ danger: true }}
              onConfirm={async () => {
                try {
                  await revokeGrant({ agentId: live.id, grantId: row.id }).unwrap();
                  setIssued(null);
                  message.success('Grant revoked');
                } catch (error) {
                  message.error(agentErrorMessage(error, 'Unable to revoke the grant'));
                }
              }}
            >
              <Button type="link" size="small" danger className={styles.inlineAction}>Revoke</Button>
            </Popconfirm>
          ) : undefined,
        };
      }
    });
    const previous = agents.filter((row) => row.id !== agent?.id).map((row): ActivityItem => ({
      key: `agent-${row.id}`,
      at: row.updated_at,
      tone: 'neutral',
      text: <>Agent <span className={styles.mono}>{shortUid(row.agent_uid)}</span> {row.state.label.toLowerCase()}</>,
    }));
    return [...grants, ...previous].sort((a, b) => b.at.localeCompare(a.at));
  }, [grantsQuery.data, agents, agent?.id, canManageAgents, live, revokeGrant]);

  const status = agentStatus(live);
  const title = computer?.sku || computer?.name || (computer ? `Computer #${computer.id}` : '');
  const subtitle = computer?.sku && computer.name ? computer.name : undefined;
  const visibleActivity = showAllActivity ? activity : activity.slice(0, 4);

  const header = (
    <div className={styles.header}>
      <span className={styles.headerIcon} aria-hidden="true"><LaptopOutlined /></span>
      <div className={styles.headerText}>
        <div className={styles.headerTitle}>{resolvedView === 'setup' ? `Set up agent on ${title}` : title}</div>
        <div className={styles.headerSub}>{resolvedView === 'setup' ? subtitle ?? 'LabMango agent' : subtitle ?? 'LabMango agent'}</div>
      </div>
    </div>
  );

  const infoView = (
    <div className={styles.info}>
      <dl className={styles.strip}>
        <div>
          <dt>Status</dt>
          <dd><StatusBadge tone={agentsQuery.isError ? 'danger' : status.tone} label={agentsQuery.isError ? 'Unavailable' : status.label} title={status.hint} fit /></dd>
        </div>
        <div>
          <dt>Last heartbeat</dt>
          <dd><Ago value={live?.last_seen_at} never={live ? 'Never' : '—'} /></dd>
        </div>
        <div>
          <dt>Version</dt>
          <dd>{live?.agent_version || '—'}</dd>
        </div>
      </dl>

      {!live && !agentsQuery.isLoading && (
        <div className={styles.empty}>
          <p>No agent is installed on this computer.</p>
          <span>{canManageAgents ? 'Set one up to report health, sessions and booking check-ins.' : 'A lab coordinator can set one up.'}</span>
        </div>
      )}

      {live && (
        <section>
          <h4 className={styles.sectionTitle}>Details</h4>
          <dl className={styles.rows}>
            <div><dt>Agent ID</dt><dd><Mono value={live.agent_uid} /></dd></div>
            <div><dt>State</dt><dd>{live.state.label}</dd></div>
            {live.key_algorithm && (
              <div><dt>Key</dt><dd className={styles.keyValue}>{live.key_algorithm.label}{live.key_storage && <span className={styles.chip}>{live.key_storage.label}</span>}</dd></div>
            )}
            {live.fingerprint && <div><dt>Device fingerprint</dt><dd><Mono value={live.fingerprint} /></dd></div>}
            {live.enrolled_at && <div><dt>Enrolled</dt><dd>{formatTime(live.enrolled_at)}</dd></div>}
          </dl>
        </section>
      )}

      {activity.length > 0 && (
        <section>
          <h4 className={styles.sectionTitle}>Activity</h4>
          <ul className={styles.activity}>
            {visibleActivity.map((item) => (
              <li key={item.key}>
                <i className={`${styles.activityDot} ${styles[item.tone]}`} aria-hidden="true" />
                <span className={styles.activityText}>{item.text}{item.meta && <span className={styles.activityMeta}> {item.meta}</span>}</span>
                {item.action}
                <span className={styles.activityTime}><Ago value={item.at} /></span>
              </li>
            ))}
          </ul>
          {activity.length > 4 && (
            <Button type="link" size="small" className={styles.inlineAction} onClick={() => setShowAllActivity((value) => !value)}>
              {showAllActivity ? 'Show less' : `Show all ${activity.length}`}
            </Button>
          )}
        </section>
      )}
    </div>
  );

  const progress: Record<string, ReactNode> = {
    configure: <span className={styles.muted}>Not connected yet</span>,
    waiting: <><Spin size="small" /> Waiting for the agent to enroll<span className={styles.muted}> · grant expires in <span className={styles.countdown}>{formatCountdown(remaining)}</span></span></>,
    expired: <><ExclamationCircleFilled className={styles.warningIcon} /> The grant expired. Generate a new command.</>,
    enrolled: <><Spin size="small" /> Enrolled. Waiting for the first heartbeat…</>,
    connected: <><CheckCircleFilled className={styles.successIcon} /> Agent connected</>,
  };

  const footer = resolvedView === 'setup' ? (
    <div className={styles.footer}>
      <span className={styles.progress} role="status" aria-live="polite">{progress[phase]}</span>
      {phase === 'expired' && <Button onClick={() => setIssued(null)}>New command</Button>}
      {live && state === 'active' && (
        <Button type={phase === 'connected' ? 'primary' : 'default'} onClick={() => { setRecovering(false); setView('info'); }}>
          {phase === 'connected' ? 'View agent' : 'Back'}
        </Button>
      )}
    </div>
  ) : canManageAgents ? (
    <div className={styles.footer}>
      {live && state === 'active' ? (
        <Dropdown
          trigger={['click']}
          placement="topLeft"
          rootClassName={styles.removeMenu}
          menu={{
            items: [
              { key: 'revoke', icon: <StopOutlined />, label: <MenuChoice title="Revoke" hint="Key may be compromised" />, onClick: () => retire('revoke') },
              { key: 'decommission', icon: <PoweroffOutlined />, label: <MenuChoice title="Decommission" hint="Computer leaves service" />, onClick: () => retire('decommission') },
            ],
          }}
        >
          <Button className={styles.removeButton}>Remove agent <DownOutlined className={styles.caret} /></Button>
        </Dropdown>
      ) : <span />}
      <span className={styles.footerRight}>
        {live && state === 'active'
          ? <Button className={styles.reenrollButton} icon={<SyncOutlined />} onClick={() => { setRecovering(true); setIssued(null); setView('setup'); }}>Re-enroll</Button>
          : <Button type="primary" disabled={!computer?.uid} onClick={() => setView('setup')}>{state === 'pending' ? 'Continue setup' : 'Set up agent'}</Button>}
      </span>
    </div>
  ) : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={resolvedView === 'setup' ? 680 : 560}
      destroyOnHidden
      rootClassName={styles.dialog}
      title={header}
      footer={footer}
    >
      {resolvedView === 'setup'
        ? <AgentSetup agent={live} grant={grant} mode={setupMode} generating={issueState.isLoading || reissueState.isLoading} onGenerate={generate} />
        : infoView}
    </Modal>
  );
}

export default ComputingAgentDialog;
