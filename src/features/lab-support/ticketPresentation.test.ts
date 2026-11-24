import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTicketActivityLines,
  getTicketPriorityMeta,
  getTicketSlaMeta,
  getTicketStatusMeta,
  getTicketTypeMeta,
  getResolutionLabel,
  getResolutionOptions,
  getWorkflowAction,
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

test('workflow actions use configured names and distinguish starting, resuming, and reopening', () => {
  const target = {
    id: 1,
    status: { id: 2, name: 'In Progress' },
    system_state: { value: 'active', label: 'Active' },
    is_final: false,
    is_sla_paused: false,
    is_reason_required: false,
    is_resolution_required: false,
    is_reopen: false,
  };
  assert.equal(getWorkflowAction(target, 'open'), 'Start work');
  assert.equal(getWorkflowAction(target, 'waiting'), 'Resume work');
  assert.equal(getWorkflowAction({ ...target, is_reopen: true }, 'done'), 'Reopen to In Progress');
  assert.equal(
    getWorkflowAction({ ...target, is_reopen: true, status: { id: 1, name: 'Open' } }, 'done'),
    'Reopen ticket',
  );

  const custom = { ...target, status: { id: 3, name: 'Lab review' } };
  assert.equal(getWorkflowAction(custom, 'open'), 'Move to Lab review');
  assert.equal(getTicketStatusMeta(custom.status, 'active', false).variant, 'in_progress');
  assert.equal(getTicketStatusMeta({ name: 'Archived' }, 'done', true).variant, 'closed');
});

test('resolution outcomes follow the request type and historical outcomes retain a label', () => {
  assert.ok(getResolutionOptions('service_request').some(({ value }) => value === 'fulfilled'));
  assert.ok(!getResolutionOptions('service_request').some(({ value }) => value === 'fixed'));
  assert.equal(getResolutionOptions('question')[0].value, 'guidance_provided');
  assert.equal(getResolutionOptions('change')[0].value, 'change_implemented');
  assert.equal(getResolutionOptions('incident')[0].value, 'fixed');
  assert.equal(getResolutionLabel('user_error'), 'User error / guidance provided');
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
    'Outcome: Issue fixed',
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
