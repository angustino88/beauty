import assert from 'node:assert/strict';
import test from 'node:test';
import { equipmentWriteBody } from './equipmentAdapter.ts';

test('equipment edit maps optional specifications and nested computing fields', () => {
  const computing = { technical_user_id: null };
  assert.deepEqual(equipmentWriteBody({
    firmware_version: '',
    power_draw_w: 0,
    weight_kg: 1.25,
    warranty_end_date: null,
    is_calibration_required: false,
    group_id: null,
    computing,
  }, false), {
    firmware_version: '',
    power_draw_w: 0,
    weight_kg: '1.25',
    warranty_end_date: null,
    is_calibration_required: false,
    group_id: null,
    computing,
  });
});
