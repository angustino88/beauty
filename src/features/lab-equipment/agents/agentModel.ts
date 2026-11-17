/**
 * Pure helpers for computing-equipment agents: health tones, which identity is "the" agent of a
 * computer, enrollment progress and the setup commands shown to an operator. No React, no API
 * imports, so it runs under `node --test`.
 */

export type AgentTone = 'success' | 'info' | 'reserved' | 'warning' | 'danger' | 'neutral';

export type AgentState = 'pending' | 'active' | 'revoked' | 'decommissioned';

/** Values the backend derives in `AgentIdentity.health`; unknown future values fall back to neutral. */
export type AgentHealthValue = 'online' | 'stale' | 'offline' | 'never_seen' | 'awaiting_enrollment' | 'retired';

interface Choice { value: string; label: string }

/** The subset of the agent wire shape these helpers read. */
export interface AgentLike {
  id: number;
  agent_uid: string;
  state: Choice;
  health?: Choice | null;
  last_seen_at: string | null;
  enrolled_at: string | null;
  created_at: string;
  equipment: { id: number; name: string } | null;
}

const HEALTH_TONE: Record<AgentHealthValue, AgentTone> = {
  online: 'success',
  stale: 'warning',
  offline: 'danger',
  never_seen: 'warning',
  awaiting_enrollment: 'info',
  retired: 'neutral',
};

const HEALTH_HINT: Record<AgentHealthValue, string> = {
  online: 'The agent is sending heartbeats.',
  stale: 'Heartbeats are late. The computer may be busy, sleeping or losing network.',
  offline: 'No heartbeat for a while. Check that the computer is on and the agent service is running.',
  never_seen: 'Enrolled, but the agent has not sent its first heartbeat yet.',
  awaiting_enrollment: 'Waiting for the computer to redeem its enrollment grant.',
  retired: 'This agent was revoked or decommissioned and can no longer sign requests.',
};

export function agentHealthTone(value: string | null | undefined): AgentTone {
  return (value && HEALTH_TONE[value as AgentHealthValue]) || 'neutral';
}

export function agentHealthHint(value: string | null | undefined): string {
  return (value && HEALTH_HINT[value as AgentHealthValue]) || 'Agent status is unknown.';
}

export const GRANT_TONE: Record<string, AgentTone> = {
  usable: 'info',
  redeemed: 'success',
  revoked: 'neutral',
  expired: 'neutral',
};

export function isLive(agent: AgentLike): boolean {
  return agent.state.value === 'active' || agent.state.value === 'pending';
}

/**
 * The agent a computer is represented by: its live (active or pending) identity — the database
 * allows at most one — otherwise the most recently created retired one, otherwise none.
 */
export function currentAgent<T extends AgentLike>(agents: readonly T[]): T | undefined {
  const live = agents.find(isLive);
  if (live) return live;
  return [...agents].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)[0];
}

/** Live agent per equipment id, for the inventory column. */
export function liveAgentsByEquipment<T extends AgentLike>(agents: readonly T[]): Map<number, T> {
  const map = new Map<number, T>();
  for (const agent of agents) {
    if (agent.equipment && isLive(agent) && !map.has(agent.equipment.id)) map.set(agent.equipment.id, agent);
  }
  return map;
}

/** Steps of the enrollment checklist, in order. */
export const ENROLLMENT_STEPS = [
  { key: 'grant', title: 'Grant issued', description: 'One-time, short-lived, bound to this computer' },
  { key: 'enroll', title: 'Device enrolled', description: 'The agent proved its key and redeemed the grant' },
  { key: 'heartbeat', title: 'First heartbeat', description: 'The agent reached the backend with a signed request' },
] as const;

/**
 * Index of the step in progress (0..2) or 3 when all are done; `failed` when the grant can no
 * longer be redeemed (agent retired, or the grant expired before enrollment).
 */
export function enrollmentProgress(
  agent: Pick<AgentLike, 'state' | 'last_seen_at'> | undefined,
  { grantExpired = false }: { grantExpired?: boolean } = {},
): { current: number; failed: boolean } {
  if (!agent) return { current: 0, failed: false };
  const state = agent.state.value;
  if (state === 'pending') return { current: 1, failed: grantExpired };
  if (state === 'active') return { current: agent.last_seen_at ? 3 : 2, failed: false };
  return { current: 1, failed: true };
}

/** Whole seconds until `expiresAt` (never negative). */
export function secondsUntil(expiresAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000));
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function shortUid(uid: string): string {
  return uid.length > 13 ? `${uid.slice(0, 8)}…${uid.slice(-4)}` : uid;
}

export type SetupPlatform = 'windows' | 'linux' | 'macos' | 'stub';

export interface SetupContext {
  backendUrl: string;
  agentUid: string;
  /** Agent executable name; configurable because the packaged client lives outside this repository. */
  cli: string;
  /** Only the development stub takes the grant on its command line. */
  grant?: string;
}

export interface SetupBlock { title: string; description?: string; shell: string; code: string }

/**
 * Commands for one platform. Production clients never receive the grant on a command line, URL,
 * config file or log (docs/agent-platform/device-design.md): `enroll` prompts for it with hidden input.
 */
export function setupBlocks(platform: SetupPlatform, ctx: SetupContext): SetupBlock[] {
  const url = ctx.backendUrl.replace(/\/+$/, '');
  if (platform === 'stub') {
    return [
      {
        title: 'Enroll the stub agent',
        description: 'Development and test only. Run from the backend repository; the key is written to ~/.labmango-stub-agent.json.',
        shell: 'bash',
        code: `python tools/stub_agent.py enroll --base-url ${url} --agent-uid ${ctx.agentUid} --grant ${ctx.grant ?? '<grant>'}`,
      },
      { title: 'Send the first heartbeat', shell: 'bash', code: 'python tools/stub_agent.py heartbeat' },
    ];
  }
  const exe = platform === 'windows' ? `.\\${ctx.cli}.exe` : platform === 'macos' ? `./${ctx.cli}` : `sudo ./${ctx.cli}`;
  const shell = platform === 'windows' ? 'powershell' : 'bash';
  const where = platform === 'windows'
    ? 'Open PowerShell as Administrator in the folder where the agent was installed.'
    : 'Open a terminal in the folder where the agent was installed.';
  return [
    {
      title: 'Enroll',
      description: `${where} When asked, paste the enrollment grant below; the input is hidden and the grant is never stored.`,
      shell,
      code: `${exe} enroll --url ${url} --agent-uid ${ctx.agentUid}`,
    },
    {
      title: 'Check the connection',
      description: 'The agent generates its key on the device, proves it to the backend and starts sending heartbeats.',
      shell,
      code: `${exe} status`,
    },
  ];
}
