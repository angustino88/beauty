import test from 'node:test';
import assert from 'node:assert/strict';
import type { LabItem, PersonaItem } from '../types.ts';
import { assessLab, assessPersona } from './assessment.ts';

const persona = (values: Partial<PersonaItem>): PersonaItem => ({
  id: 1, username: 'alice', display_name: 'Alice', avatar: null, points: 0,
  wfo_rate: 0, wfh_rate: 1, late_rate: 0, labs_accessed: 1, usage_efficiency: 0,
  active_rate: null, ad_hoc_rate: null, total_bookings: 0, no_show_bookings: 0,
  booking_compliance: null, booking_utilization: null, slot_adherence: null,
  total_sessions: 0, total_usage_minutes: 0, active_usage_minutes: 0,
  avg_session_minutes: 0, longest_session_minutes: 0, last_remote: null, top_projects: [],
  ...values,
});

const lab = (values: Partial<LabItem>): LabItem => ({
  id: 1, lab_name: 'Bench', computer_name: null, image: null, points: 0, active_users: 0,
  utilization_rate: 0, booking_fill: 0, total_bookings: 0, no_show_bookings: 0,
  booking_compliance: null, booking_utilization: null, availability: 0, last_remote: null,
  total_sessions: 0, total_usage_minutes: 0, downtime_hours: 0, top_projects: [],
  ...values,
});

test('a reliable, focused user is rated excellent with the strengths named', () => {
  const result = assessPersona(persona({
    total_sessions: 10, total_bookings: 10, booking_compliance: 1, booking_utilization: 0.9,
    slot_adherence: 0.98, active_rate: 0.92, ad_hoc_rate: 0, usage_efficiency: 0.6, labs_accessed: 3,
  }));

  assert.equal(result.rating, 'excellent');
  assert.ok((result.score ?? 0) >= 85);
  assert.deepEqual(result.strengths.slice(0, 3), [
    'Attends 100% of bookings', 'Uses 90% of booked time', 'Stays within booked slots',
  ]);
  assert.ok(result.strengths.includes('Strong lab usage: 4.8 h active per weekday'));
  assert.deepEqual(result.improvements, []);
});

test('no-shows, idle sessions and late hours become points to improve', () => {
  const result = assessPersona(persona({
    total_sessions: 6, total_bookings: 5, no_show_bookings: 3, booking_compliance: 0.4,
    booking_utilization: 0.3, slot_adherence: 0.7, active_rate: 0.35, ad_hoc_rate: 0.6, late_rate: 0.4,
  }));

  assert.equal(result.rating, 'needs_attention');
  assert.deepEqual(result.improvements, [
    "3 of 5 bookings not attended: cancel slots you won't use",
    'Uses only 30% of booked time: book shorter slots',
    '30% of booked-session time is outside the slot',
    'Sessions are mostly idle (35% active)',
    '60% of sessions without a booking: book ahead',
    '40% of lab time after hours (20:00–06:00)',
  ]);
});

test('too little activity is not judged', () => {
  const result = assessPersona(persona({ total_sessions: 1, active_rate: 1, ad_hoc_rate: 1 }));
  assert.equal(result.rating, 'limited_data');
  assert.equal(result.score, null);
});

test('a busy, well-kept bench is rated well; an overbooked idle one is flagged', () => {
  const busy = assessLab(lab({
    total_sessions: 30, active_users: 6, utilization_rate: 0.65, total_bookings: 20,
    booking_compliance: 0.95, booking_utilization: 0.85, booking_fill: 0.7,
  }));
  assert.equal(busy.rating, 'excellent');
  assert.equal(busy.strengths[0], 'Well used: active 65% of working hours');

  const idle = assessLab(lab({
    total_sessions: 3, utilization_rate: 0.1, booking_fill: 0.6, total_bookings: 6,
    no_show_bookings: 4, booking_compliance: 0.33, booking_utilization: 0.2,
  }));
  assert.equal(idle.rating, 'needs_attention');
  assert.ok(idle.improvements.includes('Booked 60% of working hours but active only 10%'));
  assert.ok(idle.improvements.includes('4 of 6 booked slots not used'));
});

test('a mid-range user still gets their strongest and weakest area named', () => {
  const result = assessPersona(persona({
    total_sessions: 9, total_bookings: 8, no_show_bookings: 1, booking_compliance: 0.88,
    booking_utilization: 0.62, slot_adherence: 0.86, active_rate: 0.72, ad_hoc_rate: 0.2, late_rate: 0.12,
  }));
  assert.equal(result.rating, 'good');
  assert.deepEqual(result.strengths, ['Strongest area: booking attendance (88%)']);
  assert.deepEqual(result.improvements, ['Most room to grow: booked time used (62%)']);
});
