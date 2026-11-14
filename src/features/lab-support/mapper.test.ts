import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapSupportTicket,
  mapSupportTicketsResponse,
} from './mapper.ts';

test('mapSupportTicket maps native support ticket data correctly', () => {
  const backendTicket = {
    id: 101,
    key: 'TIC-101',
    number: 101,
    subject: 'Oscilloscope calibration error',
    category: { id: 3, name: 'Measurement' },
    priority: { id: 2, name: 'High', level: 2 },
    status: { id: 1, name: 'Open', system_state: 'new' },
    requester: { id: 5, username: 'tech1', display_name: 'Lab Tech' },
    assignee: { id: 8, username: 'coord1', display_name: 'Coordinator' },
    created_at: '2026-10-30T09:00:00Z',
    updated_at: '2026-10-30T10:00:00Z',
  };

  const ticket = mapSupportTicket(backendTicket);

  assert.equal(ticket.id, 101);
  assert.equal(ticket.key, 'TIC-101');
  assert.equal(ticket.subject, 'Oscilloscope calibration error');
  assert.equal(ticket.summary, 'Oscilloscope calibration error');
  assert.equal(ticket.category?.name, 'Measurement');
  assert.equal(typeof ticket.priority === 'object' ? ticket.priority?.name : ticket.priority, 'High');
  assert.equal(typeof ticket.status === 'object' ? ticket.status?.name : ticket.status, 'Open');
  assert.equal(typeof ticket.requester === 'object' ? ticket.requester?.username : ticket.requester, 'tech1');
});

test('mapSupportTicketsResponse handles paginated response envelope', () => {
  const payload = {
    meta: {
      pagination: {
        count: 50,
        page: 1,
        page_size: 10,
        next: null,
        previous: null,
      },
    },
    data: [
      { id: 1, key: 'TIC-1', subject: 'Issue 1' },
      { id: 2, key: 'TIC-2', subject: 'Issue 2' },
    ],
  };

  const res = mapSupportTicketsResponse(payload);
  assert.equal(res.total, 50);
  assert.equal(res.tickets.length, 2);
  assert.equal(res.tickets[0].subject, 'Issue 1');
});

test('mapSupportTicket normalizes newly created ticket response', () => {
  const createdTicket = {
    id: 202,
    key: 'TIC-202',
    subject: 'New network cable request',
    description: 'Need 5m Cat6 cable for bench 4',
    category: { id: 1, name: 'Network' },
    priority: { id: 3, name: 'Medium', level: 3 },
    status: { id: 1, name: 'New', system_state: 'new' },
  };

  const ticket = mapSupportTicket(createdTicket);
  assert.equal(ticket.id, 202);
  assert.equal(ticket.key, 'TIC-202');
  assert.equal(ticket.subject, 'New network cable request');
  assert.equal(ticket.category?.name, 'Network');
  assert.equal(typeof ticket.priority === 'object' ? ticket.priority?.name : ticket.priority, 'Medium');
});
