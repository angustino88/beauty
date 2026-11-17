import { Tooltip } from 'antd';
import dayjs from 'dayjs';
import type { AgentIdentityRead } from '@/shared/api/generated/api';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { agentHealthHint, agentHealthTone } from './agentModel';
import styles from './ComputingAgent.module.css';

/** Inventory cell: the live agent's health, or "No agent"; clicking opens the agent drawer. */
export function AgentHealthCell({ agent, loading, onOpen }: {
  agent: AgentIdentityRead | undefined;
  loading: boolean;
  onOpen: () => void;
}) {
  if (loading && !agent) return <span className={styles.muted}>…</span>;
  const tip = agent
    ? `${agentHealthHint(agent.health?.value)}${agent.last_seen_at ? ` Last heartbeat ${dayjs(agent.last_seen_at).format('MMM D, HH:mm')}.` : ''}`
    : 'No agent is enrolled for this computer. Click to set one up.';
  return (
    <Tooltip title={tip}>
      <button
        type="button"
        className={styles.cellButton}
        aria-label={`Agent: ${agent?.health?.label ?? 'No agent'}`}
        onClick={(event) => { event.stopPropagation(); onOpen(); }}
      >
        <StatusBadge
          tone={agent ? agentHealthTone(agent.health?.value) : 'neutral'}
          label={agent?.health?.label ?? 'No agent'}
          title={tip}
        />
      </button>
    </Tooltip>
  );
}
