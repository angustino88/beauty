import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapPersonaResponse,
  mapLabResponse,
  mapAssessmentResponse,
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

test('mapAssessmentResponse maps the scorecard, strengths and development areas', () => {
  const result = mapAssessmentResponse({
    data: {
      period: { starts_at: '2026-04-06T00:00:00Z', ends_at: '2026-04-10T23:59:59Z' },
      previous_period: { starts_at: '2026-04-01T00:00:00Z', ends_at: '2026-04-06T00:00:00Z' },
      rating: { value: 'meets', label: 'Meets expectations' },
      score: 82, previous_score: 60, summary: 'Meets expectations: 82/100.',
      total_sessions: 4, total_bookings: 5,
      kpis: [{ kpi: { value: 'after_hours', label: 'After-hours share' }, value: 0, previous_value: null, target: 0.1, is_higher_better: false, weight: 1, status: { value: 'met', label: 'On target' } }],
      strengths: [{ kpi: { value: 'active_rate', label: 'Active time in sessions' }, text: 'Focused.' }],
      development_areas: [{ kpi: { value: 'booking_attendance', label: 'Booking attendance' }, severity: { value: 'near', label: 'Near target' }, text: 'At 80%.', recommendation: 'Cancel unused slots.' }],
    },
  });
  assert.equal(result.rating.label, 'Meets expectations');
  assert.equal(result.previous_score, 60);
  assert.deepEqual(result.kpis[0], { kpi: { value: 'after_hours', label: 'After-hours share' }, value: 0, previous_value: null, target: 0.1, is_higher_better: false, weight: 1, status: { value: 'met', label: 'On target' } });
  assert.equal(result.development_areas[0].recommendation, 'Cancel unused slots.');
});

test('mapPersonaResponse reads Early Release Rate and idle reserved minutes', () => {
  const [row] = mapPersonaResponse({ data: [{ id: 1, username: 'a', points: 0, total_sessions: 1, early_release_rate: 0, idle_reserved_minutes: 180 }] } as never);
  assert.equal(row.early_release_rate, 0);
  assert.equal(row.idle_reserved_minutes, 180);
  const [none] = mapPersonaResponse({ data: [{ id: 2, username: 'b', points: 0, total_sessions: 1, early_release_rate: null }] } as never);
  assert.equal(none.early_release_rate, null);
  assert.equal(none.idle_reserved_minutes, 0);
});
