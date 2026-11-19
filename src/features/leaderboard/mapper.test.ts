import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapPersonaResponse,
  mapLabResponse,
  mapUserWeeklyUsageResponse,
} from './mapper.ts';

test('mapPersonaResponse transforms persona rows with top projects', () => {
  const payload = {
    data: [
      {
        id: 10,
        username: 'alice',
        display_name: 'Alice Wonder',
        points: 450,
        total_sessions: 32,
        top_projects: ['Project Alpha', 'Project Beta'],
      },
    ],
  };

  const res = mapPersonaResponse(payload as unknown as Parameters<typeof mapPersonaResponse>[0]);
  assert.equal(res.length, 1);
  assert.equal(res[0].username, 'alice');
  assert.equal(res[0].display_name, 'Alice Wonder');
  assert.equal(res[0].points, 450);
  assert.equal(res[0].top_projects.length, 2);
  assert.equal(res[0].top_projects[0].project_name, 'Project Alpha');
});

test('mapLabResponse transforms lab rows with downtime hours', () => {
  const payload = {
    data: [
      {
        id: 1,
        name: 'Bench Station 1',
        points: 120,
        total_sessions: 15,
        downtime_minutes: 180,
      },
    ],
  };

  const res = mapLabResponse(payload as unknown as Parameters<typeof mapLabResponse>[0]);
  assert.equal(res.length, 1);
  assert.equal(res[0].lab_name, 'Bench Station 1');
  assert.equal(res[0].downtime_hours, 3);
});

test('mapUserWeeklyUsageResponse aggregates heatmap day/hour entries into 7 weekdays', () => {
  const payload = {
    data: [
      { day: 1, hour: 9, usage: 60 },
      { day: 1, hour: 10, usage: 45 },
      { day: 2, hour: 14, usage: 120 },
      { day: 0, hour: 8, usage: 30 }, // Sunday mapped to weekday 7
    ],
  };

  const res = mapUserWeeklyUsageResponse(payload as unknown as Parameters<typeof mapUserWeeklyUsageResponse>[0]);
  assert.equal(res.length, 7);
  assert.equal(res[0].weekday, 1);
  assert.equal(res[0].total_minutes, 105);
  assert.equal(res[1].weekday, 2);
  assert.equal(res[1].total_minutes, 120);
  assert.equal(res[6].weekday, 7);
  assert.equal(res[6].total_minutes, 30);
});

test('mapPersonaResponse keeps KPIs that do not apply as null, not 0', () => {
  const [row] = mapPersonaResponse({ data: [{ id: 1, username: 'a', points: 0, total_sessions: 2, booking_compliance: null, booking_utilization: 0.5, active_rate: 0.8 }] } as never);
  assert.equal(row.booking_compliance, null);
  assert.equal(row.booking_utilization, 0.5);
  assert.equal(row.active_rate, 0.8);
  assert.equal(row.slot_adherence, null);
});

test('mapLabResponse reads the bench KPIs', () => {
  const [row] = mapLabResponse({ data: [{ id: 2, name: 'Rig', points: 1, total_sessions: 3, utilization_rate: 0.4, booking_fill: 0.6, total_bookings: 4, no_show_bookings: 1, booking_compliance: 0.75, total_usage_minutes: 90 }] } as never);
  assert.deepEqual(
    [row.utilization_rate, row.booking_fill, row.total_bookings, row.no_show_bookings, row.booking_compliance, row.total_usage_minutes],
    [0.4, 0.6, 4, 1, 0.75, 90],
  );
});
