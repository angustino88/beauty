import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capacityPeak, capacityUse, formatMetric, heatColor, heatHex, normalise, overlayDomain } from './overlays.ts';
import type { RackData } from '../types.ts';

const rack = (powerUsage: number | null, temperature: number | null = null) =>
  ({ powerUsage, temperature } as unknown as RackData);

test('heat ramp runs from blue to red and clamps', () => {
  assert.equal(heatHex(0), '#2563eb');
  assert.equal(heatHex(1), '#dc2626');
  assert.deepEqual(heatColor(-1), heatColor(0));
  assert.deepEqual(heatColor(2), heatColor(1));
});

test('power scales to the busiest station; temperature and humidity use fixed bands', () => {
  assert.deepEqual(overlayDomain([rack(2), rack(6), rack(null)], 'power'), [0, 6]);
  assert.deepEqual(overlayDomain([], 'power'), [0, 1]);
  assert.deepEqual(overlayDomain([rack(1, 40)], 'temperature'), [18, 50]);
  assert.deepEqual(overlayDomain([], 'humidity'), [20, 75]);
  assert.equal(formatMetric(48.4, 'humidity'), '48 %');
  assert.equal(normalise(34, [18, 50]), 0.5);
});

test('capacity use reports each rated limit and the tightest one', () => {
  const station = {
    benchCount: 1,
    benchCapacity: 4,
    capacity: {
      power_capacity_w: 5000, power_reserved_w: 500, power_installed_w: 3000,
      max_load_kg: null, load_installed_kg: 120, rack_units: 42, rack_units_used: 21,
    },
  } as unknown as RackData;
  assert.deepEqual(capacityUse(station), { power: 0.7, load: null, rackUnits: 0.5, benches: 0.25 });
  assert.equal(capacityPeak(station), 0.7);
  assert.equal(capacityPeak({ capacity: undefined } as unknown as RackData), null);
  assert.equal(formatMetric(0.7, 'capacity'), '70 %');
  assert.deepEqual(overlayDomain([], 'capacity'), [0, 1]);
});
