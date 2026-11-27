import test from 'node:test';
import assert from 'node:assert/strict';
import { clearShownAlerts, hasShownAlert, markAlertShown } from './shownAlerts.ts';

test('shownAlerts tracks one-time alert IDs and clears cleanly on logout', () => {
  clearShownAlerts();
  assert.equal(hasShownAlert(42), false);

  markAlertShown(42);
  assert.equal(hasShownAlert(42), true);
  assert.equal(hasShownAlert(43), false);

  // Marking twice is idempotent.
  markAlertShown(42);
  assert.equal(hasShownAlert(42), true);

  clearShownAlerts();
  assert.equal(hasShownAlert(42), false);
});
