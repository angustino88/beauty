import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Segmented, Steps, Tooltip, Typography, message } from 'antd';
import { CopyOutlined, KeyOutlined, ReloadOutlined } from '@ant-design/icons';
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
    message.error('Copy failed; select the text and copy it manually');
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
 * "Add a new agent" panel, modelled on self-hosted CI runner setup: pick the platform, run the
 * commands on the computer, and watch the checklist turn green as the device enrolls and reports.
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
  const progress = enrollmentProgress(agent, { grantExpired: grantExpired && agent?.state.value === 'pending' });
  const done = progress.current >= ENROLLMENT_STEPS.length;

  const blocks = useMemo(
    () => (agent ? setupBlocks(platform, { backendUrl: backendUrl(), agentUid: agent.agent_uid, cli: agentCli(), grant: grant?.grant }) : []),
    [agent, platform, grant?.grant],
  );

  return (
    <section className={styles.panel} aria-label="Agent enrollment">
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>{done ? 'Agent connected' : 'Connect the agent on this computer'}</h3>
          <p className={styles.panelHint}>
            {done
              ? 'Enrollment finished. The agent signs every request with a key that never leaves the computer.'
              : 'Run these steps on the computer itself. This page updates on its own as the agent checks in.'}
          </p>
        </div>
      </div>

      <Steps
        size="small"
        current={Math.min(progress.current, ENROLLMENT_STEPS.length - 1)}
        status={done ? 'finish' : progress.failed ? 'error' : 'process'}
        items={ENROLLMENT_STEPS.map((step, index) => ({
          title: step.title,
          description: step.description,
          status: index < progress.current || done ? 'finish' : undefined,
        }))}
      />

      {!done && agent?.state.value === 'pending' && (
        <>
          <div className={styles.block}>
            <div className={styles.blockTitle}><KeyOutlined /> Enrollment grant</div>
            {grant && !grantExpired ? (
              <>
                <p className={styles.blockDescription} style={{ marginLeft: 0 }}>
                  Shown once and never stored in clear. Expires in{' '}
                  <strong className={styles.countdown}>{formatCountdown(remaining)}</strong>; paste it when the agent asks.
                </p>
                <div className={styles.secretRow}>
                  <span className={styles.secretValue}>{grant.grant}</span>
                  <Tooltip title="Copy grant">
                    <Button size="small" icon={<CopyOutlined />} aria-label="Copy grant" onClick={() => copy(grant.grant, 'Grant')} />
                  </Tooltip>
                </div>
              </>
            ) : (
              <Alert
                type={grantExpired ? 'error' : 'info'}
                showIcon
                style={{ marginTop: 8 }}
                message={grantExpired ? 'This grant expired before the agent enrolled.' : 'The grant was shown when it was issued and cannot be displayed again.'}
                description={canManage ? 'Issue a new grant; any unredeemed grant for this computer is revoked.' : 'Ask a lab coordinator for a new grant.'}
                action={canManage ? <Button size="small" icon={<ReloadOutlined />} onClick={onNewGrant}>New grant</Button> : undefined}
              />
            )}
          </div>

          <div className={styles.block}>
            <Segmented<SetupPlatform> options={PLATFORMS} value={platform} onChange={setPlatform} />
          </div>
          {platform !== 'stub' && (
            <div className={styles.block}>
              <div className={styles.blockTitle}><span className={styles.blockStep}>0</span> Install</div>
              <p className={styles.blockDescription}>
                Install the LabMango agent package from your lab's software distribution on this computer.
              </p>
            </div>
          )}
          {blocks.map((block, index) => (
            <div key={block.title} className={styles.block}>
              <div className={styles.blockTitle}><span className={styles.blockStep}>{index + 1}</span>{block.title}</div>
              {block.description && <p className={styles.blockDescription}>{block.description}</p>}
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
            <Alert
              style={{ marginTop: 14 }}
              type="warning"
              showIcon
              message="Development only"
              description="The stub agent takes the grant on its command line and keeps its key in a file. Never use it on a real lab computer."
            />
          )}
        </>
      )}

      {!done && agent?.state.value === 'active' && (
        <Typography.Paragraph type="secondary" style={{ margin: '14px 0 0' }}>
          Enrolled. Waiting for the first signed heartbeat — check that the agent service is running and can reach{' '}
          <span className={styles.mono}>{backendUrl()}</span>.
        </Typography.Paragraph>
      )}
    </section>
  );
}
