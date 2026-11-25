import { useMemo, useState } from 'react';
import { Button, Radio, Select } from 'antd';
import { InlineAlert } from '@/shared/notifications';
import { AppleOutlined, LinuxOutlined, WindowsOutlined } from '@ant-design/icons';
import type { AgentIdentityRead } from '@/shared/api/generated/api';
import { CodeBlock } from './CodeBlock';
import {
  agentServerUrl,
  setupScript,
  stubScript,
  type SetupArch,
  type SetupOs,
} from './agentModel';
import styles from './ComputingAgent.module.css';
import { getApiBaseUrl, isRouterMode } from '@/shared/lib/backendTarget';

/** The clear grant, held only in memory for the dialog session that issued it. */
export interface IssuedGrant {
  agentUid: string;
  grant: string;
  expiresAt: string;
}

export type SetupMode = 'setup' | 'reissue' | 'recover';

const OS_OPTIONS: Array<{ value: SetupOs; label: string; icon: React.ReactNode }> = [
  { value: 'windows', label: 'Windows', icon: <WindowsOutlined /> },
  { value: 'linux', label: 'Linux', icon: <LinuxOutlined /> },
  { value: 'macos', label: 'macOS', icon: <AppleOutlined /> },
];
const TTL_OPTIONS = [5, 15, 30, 60].map((minutes) => ({ value: minutes, label: `Expires in ${minutes} min` }));

const env = (name: string) => (import.meta.env[name] as string | undefined) || undefined;

function guessOs(): SetupOs {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  return /Mac/i.test(ua) ? 'macos' : /Linux|X11/i.test(ua) ? 'linux' : 'windows';
}

/**
 * "Add an agent" page in the shape of self-hosted CI runner setup: pick the platform, then
 * Download, Configure and Verify. Configure appears once a one-time grant is issued.
 */
export function AgentSetup({ agent, grant, mode, generating, onGenerate }: {
  agent: AgentIdentityRead | undefined;
  grant: IssuedGrant | null;
  mode: SetupMode;
  generating: boolean;
  onGenerate: (ttlMinutes: number) => void;
}) {
  const [os, setOs] = useState<SetupOs>(guessOs);
  const [arch, setArch] = useState<SetupArch>('x64');
  const [ttl, setTtl] = useState(15);
  const [showStub, setShowStub] = useState(false);

  const serverUrl = agentServerUrl({
    override: env('VITE_AGENT_URL'),
    isDev: import.meta.env.DEV,
    apiUrl: env('VITE_API_URL'),
    routedUrl: isRouterMode() ? getApiBaseUrl() : undefined,
  });
  const sections = useMemo(() => setupScript({
    os,
    arch,
    serverUrl,
    agentUid: agent?.agent_uid ?? '<agent-uid>',
    cli: env('VITE_AGENT_CLI') ?? 'labmango-agent',
    downloadUrl: env('VITE_AGENT_DOWNLOAD_URL'),
    grant: grant?.grant,
  }), [os, arch, serverUrl, agent?.agent_uid, grant?.grant]);
  const download = sections.find((section) => section.key === 'download');
  const configure = sections.find((section) => section.key === 'configure');
  const verify = sections.find((section) => section.key === 'verify');

  return (
    <div className={styles.setup}>
      <p className={styles.lead}>
        Install the LabMango agent on this computer. It enrolls once with a one-time grant, keeps its key on the
        device and reports a heartbeat every minute.
      </p>

      <div className={styles.platform}>
        <div>
          <div className={styles.label}>Operating system</div>
          <Radio.Group value={os} onChange={(event) => setOs(event.target.value as SetupOs)} optionType="button">
            {OS_OPTIONS.map((option) => (
              <Radio.Button key={option.value} value={option.value}>
                <span className={styles.osOption}>{option.icon}{option.label}</span>
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>
        <div>
          <div className={styles.label}>Architecture</div>
          <Select<SetupArch>
            value={arch}
            onChange={setArch}
            style={{ width: 110 }}
            options={[{ value: 'x64', label: 'x64' }, { value: 'arm64', label: 'ARM64' }]}
          />
        </div>
      </div>

      {!serverUrl && (
        <InlineAlert
          variant="warning"
          style={{ marginBottom: 12 }}
          title="Agent server URL is not configured"
          description="Replace <server-url> with the public address lab computers use, or configure the agent URL in your environment."
        />
      )}

      <section className={styles.step}>
        <h4 className={styles.stepTitle}>Download</h4>
        {download ? <CodeBlock section={download} /> : (
          <p className={styles.stepText}>Install the agent package from your lab's software distribution, then continue below.</p>
        )}
      </section>

      <section className={styles.step}>
        <h4 className={styles.stepTitle}>Configure</h4>
        {configure ? (
          <CodeBlock section={configure} secret={grant?.grant} />
        ) : (
          <div className={styles.generate}>
            {mode === 'recover' && (
              <InlineAlert
                variant="warning"
                compact
                title="The current agent stops working until this computer enrolls again."
                style={{ marginBottom: 12 }}
              />
            )}
            <p className={styles.stepText}>
              {mode === 'setup'
                ? 'Generate a one-time grant to get the enroll command for this computer.'
                : 'The previous grant is shown only once. Generate a new one to get the enroll command.'}
            </p>
            <div className={styles.generateRow}>
              <Select value={ttl} onChange={setTtl} options={TTL_OPTIONS} style={{ width: 170 }} />
              <Button type="primary" danger={mode === 'recover'} loading={generating} onClick={() => onGenerate(ttl)}>
                {mode === 'recover' ? 'Re-enroll' : 'Generate command'}
              </Button>
            </div>
          </div>
        )}
      </section>

      {verify && (
        <section className={styles.step}>
          <h4 className={styles.stepTitle}>Verify</h4>
          <CodeBlock section={verify} />
        </section>
      )}

      {grant && agent && (
        <div className={styles.stub}>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setShowStub((value) => !value)}>
            {showStub ? 'Hide development stub' : 'Testing without the real agent? Use the development stub'}
          </Button>
          {showStub && <CodeBlock section={stubScript({ serverUrl: serverUrl ?? (getApiBaseUrl() || window.location.origin), agentUid: agent.agent_uid, grant: grant.grant })} secret={grant.grant} />}
        </div>
      )}
    </div>
  );
}
