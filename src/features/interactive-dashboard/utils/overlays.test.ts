import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heatColor, heatHex, normalise, overlayDomain } from './overlays.ts';
import type { RackData } from '../types.ts';

const rack = (powerUsage: number | null, temperature: number | null = null) =>
  ({ powerUsage, temperature } as unknown as RackData);

test('heat ramp runs from blue to red and clamps', () => {
  assert.equal(heatHex(0), '#2563eb');
  assert.equal(heatHex(1), '#dc2626');
  assert.deepEqual(heatColor(-1), heatColor(0));
  assert.deepEqual(heatColor(2), heatColor(1));
});

test('power scales to the busiest station; temperature uses a fixed band', () => {
  assert.deepEqual(overlayDomain([rack(2), rack(6), rack(null)], 'power'), [0, 6]);
  assert.deepEqual(overlayDomain([], 'power'), [0, 1]);
  assert.deepEqual(overlayDomain([rack(1, 40)], 'temperature'), [18, 50]);
  assert.equal(normalise(34, [18, 50]), 0.5);
});
