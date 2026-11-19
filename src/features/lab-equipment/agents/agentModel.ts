/**
 * Pure helpers for computing-equipment agents: the status shown to operators, which identity is
 * "the" agent of a computer, setup progress and the setup script. No React or API imports, so it
 * runs under `node --test`. The script follows docs/agent-platform/agent-cli.md in the backend.
 */

export type AgentTone = 'success' | 'info' | 'reserved' | 'warning' | 'danger' | 'neutral';

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

export interface AgentStatus { key: string; label: string; tone: AgentTone; hint: string }

const HEALTH: Record<string, Omit<AgentStatus, 'key'>> = {
  online: { label: 'Online', tone: 'success', hint: 'Heartbeats are arriving on time.' },
  delayed: { label: 'Delayed', tone: 'warning', hint: 'Heartbeats are late. The computer may be busy or losing network.' },
  offline: { label: 'Offline', tone: 'danger', hint: 'No recent heartbeat. Check that the computer is on and the agent service runs.' },
};

export function isLive(agent: AgentLike): boolean {
  return agent.state.value === 'active' || agent.state.value === 'pending';
}

/**
 * One status per computer: health (online, delayed, offline) for an enrolled agent, "Pending"
 * while it waits to enroll, "Not installed" when it has no live agent. Health and lifecycle state
 * stay separate on the wire; this only picks which one to show.
 */
export function agentStatus(agent: AgentLike | undefined): AgentStatus {
  if (!agent || !isLive(agent)) {
    return { key: 'none', label: 'Not installed', tone: 'neutral', hint: 'No agent is enrolled for this computer.' };
  }
  if (agent.state.value === 'pending') {
    return { key: 'pending', label: 'Pending', tone: 'info', hint: 'Waiting for the computer to enroll.' };
  }
  const health = agent.health?.value ?? 'offline';
  return { key: health, ...(HEALTH[health] ?? { label: agent.health?.label ?? 'Unknown', tone: 'neutral', hint: '' }) };
}

export const GRANT_TONE: Record<string, AgentTone> = {
  usable: 'info',
  redeemed: 'success',
  revoked: 'neutral',
  expired: 'neutral',
};

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

export type SetupPhase = 'configure' | 'waiting' | 'expired' | 'enrolled' | 'connected';

/**
 * Where a setup stands: `configure` until a command is generated in this session, `waiting` while
 * the pending agent may still redeem it, `expired` when it can no longer, `enrolled` before the
 * first heartbeat, `connected` after it.
 */
export function setupPhase(
  agent: Pick<AgentLike, 'state' | 'last_seen_at'> | undefined,
  { hasGrant, grantExpired }: { hasGrant: boolean; grantExpired: boolean },
): SetupPhase {
  const state = agent?.state.value;
  if (state === 'active') return agent?.last_seen_at ? 'connected' : 'enrolled';
  if (state === 'pending' && hasGrant) return grantExpired ? 'expired' : 'waiting';
  return 'configure';
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

export type SetupOs = 'windows' | 'linux' | 'macos';
export type SetupArch = 'x64' | 'arm64';

export interface ScriptLine { kind: 'comment' | 'command'; text: string }
export interface ScriptSection {
  key: 'download' | 'configure' | 'verify';
  title: string;
  shell: 'PowerShell' | 'Shell';
  prompt: string;
  lines: ScriptLine[];
}

/**
 * The `--url` the enroll command shows, if any. In production none: the agent asks the service
 * gateway for the server address lab computers can reach, so the web app never shows a backend or
 * Router address. `VITE_AGENT_URL` sets one explicitly; development uses `VITE_API_URL`.
 */
export function agentServerUrl(options: { override?: string; isDev: boolean; apiUrl?: string }): string | undefined {
  if (options.override) return options.override;
  if (options.isDev && options.apiUrl) return options.apiUrl;
  return undefined;
}

export interface SetupContext {
  os: SetupOs;
  arch: SetupArch;
  /** `--url` for enroll; left out when the agent gets it from the gateway (see {@link agentServerUrl}). */
  serverUrl?: string;
  agentUid: string;
  /** Agent executable name (`VITE_AGENT_CLI`). */
  cli: string;
  /** Folder that holds one release's packages (`VITE_AGENT_DOWNLOAD_URL`); no download step without it. */
  downloadUrl?: string;
  /** The one-time grant; the configure step is left out until one is issued. */
  grant?: string;
}

const comment = (text: string): ScriptLine => ({ kind: 'comment', text: `# ${text}` });
const command = (text: string): ScriptLine => ({ kind: 'command', text });
/** One command over several lines with the shell's continuation (backtick in PowerShell). */
const wrapped = (windows: boolean, ...parts: string[]): ScriptLine =>
  command(parts.join(windows ? ' `\n    ' : ' \\\n    '));

/** Download → Configure → Verify, in the shape of self-hosted CI runner setup pages. */
export function setupScript(ctx: SetupContext): ScriptSection[] {
  const url = ctx.serverUrl?.replace(/\/+$/, '');
  const windows = ctx.os === 'windows';
  const shell = windows ? 'PowerShell' : 'Shell';
  const prompt = windows ? 'PS>' : '$';
  const exe = windows ? `.\\${ctx.cli}.exe` : `./${ctx.cli}`;
  const root = ctx.os === 'linux' ? 'sudo ' : '';
  const svc = windows ? '' : 'sudo ';
  const sections: ScriptSection[] = [];

  if (ctx.downloadUrl) {
    const base = ctx.downloadUrl.replace(/\/+$/, '');
    const pkg = `${ctx.cli}-${windows ? 'win' : ctx.os === 'macos' ? 'osx' : 'linux'}-${ctx.arch}.${windows ? 'zip' : 'tar.gz'}`;
    const lines = windows
      ? [
        comment('Create a folder under the drive root'),
        command(`mkdir C:\\${ctx.cli}; cd C:\\${ctx.cli}`),
        comment('Download the latest agent package'),
        wrapped(true, 'Invoke-WebRequest', `-Uri ${base}/${pkg}`, `-OutFile ${ctx.cli}.zip`),
        comment('Extract the installer'),
        command(`Expand-Archive -Path .\\${ctx.cli}.zip -DestinationPath .`),
      ]
      : [
        comment('Create a folder'),
        command(ctx.os === 'linux' ? `sudo mkdir -p /opt/${ctx.cli} && cd /opt/${ctx.cli}` : `mkdir -p ~/${ctx.cli} && cd ~/${ctx.cli}`),
        comment('Download the latest agent package'),
        wrapped(false, `${root}curl -fsSLo ${ctx.cli}.tar.gz`, `${base}/${pkg}`),
        comment('Extract the installer'),
        command(`${root}tar xzf ./${ctx.cli}.tar.gz`),
      ];
    sections.push({ key: 'download', title: 'Download', shell, prompt, lines });
  }

  if (ctx.grant) {
    sections.push({
      key: 'configure',
      title: 'Configure',
      shell,
      prompt,
      lines: [
        comment('Enroll this computer. The grant works once and expires soon.'),
        wrapped(
          windows,
          `${root}${exe} enroll`,
          ...(url ? [`--url ${url}`] : []),
          `--agent-uid ${ctx.agentUid}`,
          `--grant ${ctx.grant}`,
        ),
        comment('Install and start the background service'),
        command(`${svc}${exe} service install --start`),
      ],
    });
  }

  sections.push({
    key: 'verify',
    title: 'Verify',
    shell,
    prompt,
    lines: [comment('Show enrollment, service and heartbeat status'), command(`${root}${exe} status`)],
  });
  return sections;
}

/** The commands of a section, ready for the clipboard (no comments, no prompts). */
export function sectionCommands(section: ScriptSection): string {
  return section.lines.filter((line) => line.kind === 'command').map((line) => line.text).join('\n');
}

/** Development stub from the backend repository (tools/stub_agent.py); never for real computers. */
export function stubScript(ctx: { serverUrl: string; agentUid: string; grant?: string }): ScriptSection {
  return {
    key: 'configure',
    title: 'Development stub',
    shell: 'Shell',
    prompt: '$',
    lines: [
      comment('From the backend repository; development and tests only'),
      wrapped(
        false,
        'python tools/stub_agent.py enroll',
        `--base-url ${ctx.serverUrl.replace(/\/+$/, '')}`,
        `--agent-uid ${ctx.agentUid}`,
        `--grant ${ctx.grant ?? '<grant>'}`,
      ),
      command('python tools/stub_agent.py heartbeat'),
    ],
  };
}
