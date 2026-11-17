import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import type { AgentIdentityRead } from '@/shared/api/generated/api';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { agentStatus } from './agentModel';
import styles from './ComputingAgent.module.css';

/** Inventory cell: Online, Delayed, Offline, Pending or Not installed; clicking opens the agent dialog. */
export function AgentHealthCell({ agent, loading, onOpen }: {
  agent: AgentIdentityRead | undefined;
  loading: boolean;
  onOpen: () => void;
}) {
  if (loading && !agent) return <span className={styles.muted}>…</span>;
  const status = agentStatus(agent);
  const tip = agent?.last_seen_at ? `${status.hint} Last heartbeat ${dayjs(agent.last_seen_at).format('MMM D, HH:mm')}.` : status.hint;
  return (
    <Tooltip title={tip}>
      <button
        type="button"
        className={styles.cellButton}
        aria-label={`Agent: ${status.label}`}
        onClick={(event) => { event.stopPropagation(); onOpen(); }}
      >
        <StatusBadge tone={status.tone} label={status.label} title={tip} />
      </button>
    </Tooltip>
  );
}
