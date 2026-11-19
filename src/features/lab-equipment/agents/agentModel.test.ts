import test from 'node:test';
import assert from 'node:assert/strict';
import {
  agentServerUrl,
  agentStatus,
  currentAgent,
  formatCountdown,
  liveAgentsByEquipment,
  secondsUntil,
  sectionCommands,
  setupPhase,
  setupScript,
  type AgentLike,
} from './agentModel.ts';

const agent = (id: number, state: string, extra: Partial<AgentLike> = {}): AgentLike => ({
  id,
  agent_uid: `00000000-0000-0000-0000-00000000000${id}`,
  state: { value: state, label: state },
  health: null,
  last_seen_at: null,
  enrolled_at: null,
  created_at: `2026-11-1${id}T00:00:00Z`,
  equipment: { id: 10, name: 'PC' },
  ...extra,
});

test('status shows three health values for an enrolled agent, else the lifecycle', () => {
  const active = (value: string) => agent(1, 'active', { health: { value, label: value } });
  assert.deepEqual([active('online'), active('delayed'), active('offline')].map((a) => [agentStatus(a).label, agentStatus(a).tone]), [
    ['Online', 'success'], ['Delayed', 'warning'], ['Offline', 'danger'],
  ]);
  assert.equal(agentStatus(agent(1, 'pending')).label, 'Pending');
  assert.equal(agentStatus(agent(1, 'revoked')).label, 'Not installed');
  assert.equal(agentStatus(undefined).tone, 'neutral');
});

test('the live identity represents the computer, else the newest retired one', () => {
  assert.equal(currentAgent([agent(1, 'revoked'), agent(2, 'active'), agent(3, 'revoked')])?.id, 2);
  assert.equal(currentAgent([agent(1, 'revoked'), agent(3, 'decommissioned')])?.id, 3);
  assert.equal(currentAgent([]), undefined);
});

test('live agents are indexed by equipment id; retired ones are skipped', () => {
  const map = liveAgentsByEquipment([
    agent(1, 'revoked', { equipment: { id: 5, name: 'a' } }),
    agent(2, 'pending', { equipment: { id: 5, name: 'a' } }),
    agent(3, 'decommissioned', { equipment: { id: 6, name: 'b' } }),
  ]);
  assert.equal(map.get(5)?.id, 2);
  assert.equal(map.has(6), false);
});

test('setup phase follows grant, state and first heartbeat', () => {
  const noGrant = { hasGrant: false, grantExpired: false };
  const fresh = { hasGrant: true, grantExpired: false };
  assert.equal(setupPhase(undefined, noGrant), 'configure');
  assert.equal(setupPhase(agent(1, 'pending'), noGrant), 'configure');
  assert.equal(setupPhase(agent(1, 'pending'), fresh), 'waiting');
  assert.equal(setupPhase(agent(1, 'pending'), { hasGrant: true, grantExpired: true }), 'expired');
  assert.equal(setupPhase(agent(1, 'active'), fresh), 'enrolled');
  assert.equal(setupPhase(agent(1, 'active', { last_seen_at: '2026-11-17T00:00:00Z' }), fresh), 'connected');
});

test('countdown never goes negative', () => {
  const now = Date.parse('2026-11-17T10:00:00Z');
  assert.equal(secondsUntil('2026-11-17T10:01:05Z', now), 65);
  assert.equal(secondsUntil('2026-11-17T09:00:00Z', now), 0);
  assert.equal(formatCountdown(65), '1:05');
});

const ctx = { serverUrl: 'https://lab.example/', agentUid: 'uid-1', cli: 'labmango-agent', grant: 'eg_secret' };

test('script: download only with a package URL, configure only with a grant', () => {
  assert.deepEqual(setupScript({ ...ctx, os: 'linux', arch: 'x64', grant: undefined }).map((s) => s.key), ['verify']);
  const full = setupScript({ ...ctx, os: 'linux', arch: 'arm64', downloadUrl: 'https://dl.example/1.4.2/' });
  assert.deepEqual(full.map((s) => s.key), ['download', 'configure', 'verify']);
  assert.ok(sectionCommands(full[0]).includes('https://dl.example/1.4.2/labmango-agent-linux-arm64.tar.gz'));
  assert.equal(
    sectionCommands(full[1]),
    'sudo ./labmango-agent enroll \\\n    --url https://lab.example \\\n    --agent-uid uid-1 \\\n    --grant eg_secret\n'
      + 'sudo ./labmango-agent service install --start',
  );
});

test('script: Windows uses PowerShell, the .exe and a zip package', () => {
  const [download, configure] = setupScript({ ...ctx, os: 'windows', arch: 'x64', downloadUrl: 'https://dl.example/v1' });
  assert.equal(download.prompt, 'PS>');
  assert.ok(sectionCommands(download).includes('labmango-agent-win-x64.zip'));
  assert.ok(sectionCommands(configure).startsWith('.\\labmango-agent.exe enroll `\n    --url https://lab.example `\n'));
  assert.ok(!sectionCommands(configure).includes('# '));
});

test('agents enroll at the frontend address in production, never a build-time API URL', () => {
  const origin = 'https://labmango.company.com';
  assert.equal(agentServerUrl({ origin, isDev: false, apiUrl: 'http://10.0.0.5:8000' }), origin);
  assert.equal(agentServerUrl({ origin, isDev: true, apiUrl: 'http://127.0.0.1:8000' }), 'http://127.0.0.1:8000');
  assert.equal(agentServerUrl({ origin, isDev: false, override: 'https://agents.company.com' }), 'https://agents.company.com');
});
