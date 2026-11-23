import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTicketActivityLines,
  getTicketPriorityMeta,
  getTicketSlaMeta,
  getTicketStatusMeta,
  getTicketTypeMeta,
  getTransitionRequirements,
} from './ticketPresentation.ts';

test('getTicketStatusMeta assigns distinct semantic tones and variants to ticket lifecycle states', () => {
  const open = getTicketStatusMeta({ id: 1, name: 'Open', system_state: 'open' });
  assert.equal(open.variant, 'open');
  assert.equal(open.tone, 'info');
  assert.equal(open.isTerminal, false);

  const inProgress = getTicketStatusMeta('In Progress');
  assert.equal(inProgress.variant, 'in_progress');
  assert.equal(inProgress.tone, 'warning');
  assert.equal(inProgress.isTerminal, false);

  const waiting = getTicketStatusMeta({ name: 'Waiting for Customer', system_state: 'waiting' });
  assert.equal(waiting.variant, 'waiting');
  assert.equal(waiting.tone, 'reserved');
  assert.equal(waiting.isTerminal, false);

  const resolved = getTicketStatusMeta({ name: 'Resolved', system_state: 'done' });
  assert.equal(resolved.variant, 'resolved');
  assert.equal(resolved.tone, 'success');
  assert.equal(resolved.isTerminal, true);

  const closed = getTicketStatusMeta({ name: 'Closed', system_state: 'done' });
  assert.equal(closed.variant, 'closed');
  assert.equal(closed.tone, 'neutral');
  assert.equal(closed.isTerminal, true);
});

test('getTicketPriorityMeta maps Critical, High, Medium and Low priorities to distinct levels and tones', () => {
  const critical = getTicketPriorityMeta({ id: 1, name: 'Critical', level: 1 });
  assert.equal(critical.level, 'critical');
  assert.equal(critical.tone, 'danger');
  assert.equal(critical.rank, 1);

  const high = getTicketPriorityMeta('High');
  assert.equal(high.level, 'high');
  assert.equal(high.tone, 'warning');
  assert.equal(high.rank, 2);

  const medium = getTicketPriorityMeta('Medium');
  assert.equal(medium.level, 'medium');
  assert.equal(medium.tone, 'info');
  assert.equal(medium.rank, 3);

  const low = getTicketPriorityMeta('Low');
  assert.equal(low.level, 'low');
  assert.equal(low.tone, 'neutral');
  assert.equal(low.rank, 4);
});

test('getTicketTypeMeta normalizes choice objects and string codes', () => {
  const incident = getTicketTypeMeta({ value: 'incident', label: 'Incident' });
  assert.equal(incident.key, 'incident');
  assert.equal(incident.tone, 'danger');

  const request = getTicketTypeMeta('service_request');
  assert.equal(request.key, 'service_request');
  assert.equal(request.tone, 'info');
});

test('getTransitionRequirements detects resolution summary and reason requirements', () => {
  const toProgress = getTransitionRequirements('In Progress', 'Open');
  assert.equal(toProgress.requiresResolution, false);
  assert.equal(toProgress.requiresReason, false);
  assert.equal(toProgress.actionLabel, 'Start Progress');

  const toResolved = getTransitionRequirements('Resolved', 'In Progress');
  assert.equal(toResolved.requiresResolution, true);
  assert.equal(toResolved.requiresReason, false);
  assert.equal(toResolved.actionLabel, 'Resolve Ticket');

  const toClosedFromOpen = getTransitionRequirements('Closed', 'Open');
  assert.equal(toClosedFromOpen.requiresResolution, false);
  assert.equal(toClosedFromOpen.requiresReason, true);
  assert.equal(toClosedFromOpen.isClosing, true);

  const reopen = getTransitionRequirements('Open', 'Resolved');
  assert.equal(reopen.isReopen, true);
  assert.equal(reopen.requiresReason, true);
  assert.equal(reopen.actionLabel, 'Reopen Ticket');
});

test('getTicketSlaMeta reports breached, paused and on-track SLA states', () => {
  const breached = getTicketSlaMeta({ resolution_breached: true });
  assert.equal(breached.state, 'breached');
  assert.equal(breached.tone, 'danger');

  const waitingStatus = getTicketStatusMeta('Waiting for Customer');
  const paused = getTicketSlaMeta({ paused: true }, waitingStatus);
  assert.equal(paused.state, 'paused');
  assert.equal(paused.tone, 'reserved');
});

test('formatTicketActivityLines formats status transitions and field change diffs', () => {
  const statusLines = formatTicketActivityLines({
    payload: {
      from_status: 'Open',
      to_status: 'Resolved',
      resolution_code: 'fixed',
      resolution_summary: 'Replaced faulty BNC connector on channel 2.',
    },
  });
  assert.deepEqual(statusLines, [
    'Open → Resolved',
    'Resolution code: fixed',
    'Resolution: Replaced faulty BNC connector on channel 2.',
  ]);

  const diffLines = formatTicketActivityLines({
    payload: {
      changes: {
        priority: { old: 'Medium', new: 'Critical' },
        team: { old: null, new: 'Lab Operations' },
      },
    },
  });
  assert.deepEqual(diffLines, [
    'Priority: Medium → Critical',
    'Team: None → Lab Operations',
  ]);
});
