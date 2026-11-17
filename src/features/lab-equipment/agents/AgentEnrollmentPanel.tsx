import { useEffect, useMemo, useState } from 'react';
import { Button, Segmented, Steps, Tooltip, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { AgentIdentityRead } from '@/shared/api/generated/api';
import {
  ENROLLMENT_STEPS,
  enrollmentProgress,
  formatCountdown,
  secondsUntil,
  setupBlocks,
  type SetupPlatform,
} from './agentModel';
import styles from './ComputingAgent.module.css';

/** The clear grant, held only in memory for the drawer session that issued it. */
export interface IssuedGrant {
  agentUid: string;
  grant: string;
  expiresAt: string;
}

const PLATFORMS: Array<{ label: string; value: SetupPlatform }> = [
  { label: 'Windows', value: 'windows' },
  { label: 'Linux', value: 'linux' },
  { label: 'macOS', value: 'macos' },
  { label: 'Dev stub', value: 'stub' },
];

const backendUrl = () => (import.meta.env.VITE_API_URL as string | undefined) || window.location.origin;
const agentCli = () => (import.meta.env.VITE_AGENT_CLI as string | undefined) || 'labmango-agent';

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    message.success(`${what} copied`);
  } catch {
    message.error('Copy failed; copy the text manually');
  }
}

function useCountdown(expiresAt: string | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  return expiresAt ? secondsUntil(expiresAt, now) : 0;
}

/**
 * Compact enrollment checklist, modelled on self-hosted CI runner setup: the steps advance on
 * their own while the drawer polls; the commands show only while the agent is pending.
 */
export function AgentEnrollmentPanel({ agent, issued, canManage, onNewGrant }: {
  agent: AgentIdentityRead | undefined;
  issued: IssuedGrant | null;
  canManage: boolean;
  onNewGrant: () => void;
}) {
  const [platform, setPlatform] = useState<SetupPlatform>(() => {
    const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    return /Mac/i.test(ua) ? 'macos' : /Linux|X11/i.test(ua) ? 'linux' : 'windows';
  });
  const grant = issued && agent && issued.agentUid === agent.agent_uid ? issued : null;
  const remaining = useCountdown(grant?.expiresAt);
  const grantExpired = Boolean(grant) && remaining === 0;
  const pending = agent?.state.value === 'pending';
  const progress = enrollmentProgress(agent, { grantExpired: grantExpired && pending });
  const done = progress.current >= ENROLLMENT_STEPS.length;

  const blocks = useMemo(
    () => (agent ? setupBlocks(platform, { backendUrl: backendUrl(), agentUid: agent.agent_uid, cli: agentCli(), grant: grant?.grant }) : []),
    [agent, platform, grant?.grant],
  );

  return (
    <section className={styles.panel} aria-label="Agent enrollment">
      <Steps
        size="small"
        responsive={false}
        current={Math.min(progress.current, ENROLLMENT_STEPS.length - 1)}
        status={done ? 'finish' : progress.failed ? 'error' : 'process'}
        items={ENROLLMENT_STEPS.map((step, index) => ({
          title: step.title,
          status: index < progress.current || done ? 'finish' : undefined,
        }))}
      />

      {pending && (
        <>
          <div className={styles.grantRow}>
            <span className={styles.grantLabel}>Grant</span>
            {grant && !grantExpired ? (
              <>
                <span className={styles.secretValue}>{grant.grant}</span>
                <Tooltip title="Shown once; expires soon">
                  <span className={styles.countdown}>{formatCountdown(remaining)}</span>
                </Tooltip>
                <Button size="small" type="text" icon={<CopyOutlined />} aria-label="Copy grant" onClick={() => copy(grant.grant, 'Grant')} />
              </>
            ) : (
              <>
                <span className={styles.muted} style={{ flex: 1 }}>{grantExpired ? 'Expired' : 'Hidden (shown once)'}</span>
                {canManage && <Button size="small" onClick={onNewGrant}>New grant</Button>}
              </>
            )}
          </div>

          <Segmented<SetupPlatform> size="small" block options={PLATFORMS} value={platform} onChange={setPlatform} style={{ marginTop: 12 }} />
          {blocks.map((block) => (
            <div key={block.title} className={styles.block}>
              <div className={styles.blockTitle}>
                {block.title}
                {block.description && <span className={styles.muted}> · {block.description}</span>}
              </div>
              <div className={styles.commandWrap}>
                <pre className={styles.command} aria-label={`${block.shell} command`}>{block.code}</pre>
                <Button
                  className={styles.commandCopy}
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  aria-label="Copy command"
                  onClick={() => copy(block.code, 'Command')}
                />
              </div>
            </div>
          ))}
          {platform === 'stub' && (
            <Typography.Text type="warning" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
              Development only — never on a real lab computer.
            </Typography.Text>
          )}
        </>
      )}

      {agent?.state.value === 'active' && !done && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 10, fontSize: 12 }}>
          Waiting for the first heartbeat…
        </Typography.Text>
      )}
    </section>
  );
}
