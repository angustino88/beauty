import test from 'node:test';
import assert from 'node:assert/strict';
import {
  agentHealthTone,
  currentAgent,
  enrollmentProgress,
  formatCountdown,
  liveAgentsByEquipment,
  secondsUntil,
  setupBlocks,
  type AgentLike,
} from './agentModel.ts';

const agent = (id: number, state: string, extra: Partial<AgentLike> = {}): AgentLike => ({
  id,
  agent_uid: `00000000-0000-0000-0000-00000000000${id}`,
  state: { value: state, label: state },
  last_seen_at: null,
  enrolled_at: null,
  created_at: `2026-11-1${id}T00:00:00Z`,
  equipment: { id: 10 + (extra.equipment?.id ?? 0), name: 'PC' },
  ...extra,
});

test('health tones follow the status colour language; unknown values are neutral', () => {
  assert.equal(agentHealthTone('online'), 'success');
  assert.equal(agentHealthTone('stale'), 'warning');
  assert.equal(agentHealthTone('offline'), 'danger');
  assert.equal(agentHealthTone('awaiting_enrollment'), 'info');
  assert.equal(agentHealthTone('retired'), 'neutral');
  assert.equal(agentHealthTone('something_new'), 'neutral');
  assert.equal(agentHealthTone(undefined), 'neutral');
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

test('enrollment progress follows state and the first heartbeat', () => {
  assert.deepEqual(enrollmentProgress(undefined), { current: 0, failed: false });
  assert.deepEqual(enrollmentProgress(agent(1, 'pending')), { current: 1, failed: false });
  assert.deepEqual(enrollmentProgress(agent(1, 'pending'), { grantExpired: true }), { current: 1, failed: true });
  assert.deepEqual(enrollmentProgress(agent(1, 'active')), { current: 2, failed: false });
  assert.deepEqual(enrollmentProgress(agent(1, 'active', { last_seen_at: '2026-11-17T00:00:00Z' })), { current: 3, failed: false });
  assert.deepEqual(enrollmentProgress(agent(1, 'revoked')), { current: 1, failed: true });
});

test('countdown never goes negative', () => {
  const now = Date.parse('2026-11-17T10:00:00Z');
  assert.equal(secondsUntil('2026-11-17T10:01:05Z', now), 65);
  assert.equal(secondsUntil('2026-11-17T09:00:00Z', now), 0);
  assert.equal(formatCountdown(65), '1:05');
});

test('production commands never carry the grant; only the dev stub does', () => {
  const ctx = { backendUrl: 'https://lab.example/', agentUid: 'uid-1', cli: 'labmango-agent', grant: 'eg_secret' };
  for (const platform of ['windows', 'linux', 'macos'] as const) {
    const text = setupBlocks(platform, ctx).map((block) => block.code).join('\n');
    assert.ok(!text.includes('eg_secret'), platform);
    assert.ok(text.includes('--url https://lab.example --agent-uid uid-1'), platform);
  }
  assert.ok(setupBlocks('windows', ctx)[0].code.startsWith('.\\labmango-agent.exe enroll'));
  assert.ok(setupBlocks('stub', ctx)[0].code.includes('--grant eg_secret'));
});
