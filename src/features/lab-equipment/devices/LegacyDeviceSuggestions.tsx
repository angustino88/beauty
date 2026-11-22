import { useState } from 'react';
import { Button, Select, Tag } from 'antd';
import { equipmentPagedConfig, usePagedOptions } from '@/shared/hooks/usePagedOptions';
import { type LegacyDeviceSuggestionRead } from '@/shared/api/generated/api';
import { getApiErrorMessage, notify } from '@/shared/notifications';
import {
  useCreateExpectedDeviceMutation,
  useGetLegacyDeviceSuggestionsQuery,
  useRegisterEquipmentHardwareIdMutation,
} from './devicesApi';
import styles from './Devices.module.css';

function SuggestionRow({ computingId, suggestion }: { computingId: number; suggestion: LegacyDeviceSuggestionRead }) {
  const [equipmentId, setEquipmentId] = useState<number>();
  const equipment = usePagedOptions(equipmentPagedConfig);
  const [register, registering] = useRegisterEquipmentHardwareIdMutation();
  const [expect, expecting] = useCreateExpectedDeviceMutation();
  const status = suggestion.status.value;

  const expectOn = async (unitId: number) => {
    await expect({ computingId, equipmentId: unitId, isDisconnectAlertEnabled: false }).unwrap();
  };

  const registerAndExpect = async () => {
    if (!equipmentId) return;
    try {
      await register({
        equipmentId,
        kind: 'pnp_id',
        value: suggestion.pnp_id,
        computing_id: suggestion.is_port_bound ? computingId : null,
      }).unwrap();
      await expectOn(equipmentId);
      notify.success('Device registered and expected on this computer');
    } catch (error) {
      notify.error('Unable to register device', {
        description: getApiErrorMessage(error, 'Please try again.'),
      });
    }
  };

  const expectRegistered = async () => {
    if (!suggestion.equipment) return;
    try {
      await expectOn(suggestion.equipment.id);
      notify.success('Device marked as expected on this computer');
    } catch (error) {
      notify.error('Unable to mark device as expected', {
        description: getApiErrorMessage(error, 'Please try again.'),
      });
    }
  };

  return (
    <div className={styles.suggestionRow}>
      <div className={styles.suggestionText}>
        <strong>{suggestion.label || 'Unnamed entry'}</strong>
        <span className={styles.mono} style={{ overflowWrap: 'anywhere' }}>{suggestion.pnp_id}</span>
        {suggestion.is_port_bound && <Tag color="gold" title="Windows made this ID from the USB port; it is registered for this computer only">Port-bound</Tag>}
      </div>
      {status === 'unregistered' && (
        <div className={styles.suggestionAction}>
          <Select
            allowClear
            size="small"
            placeholder="Which unit is it?"
            aria-label={`Equipment for ${suggestion.label || suggestion.pnp_id}`}
            value={equipmentId}
            onChange={setEquipmentId}
            {...equipment.selectProps}
            options={equipment.options}
            style={{ minWidth: 220 }}
          />
          <Button size="small" type="primary" disabled={!equipmentId} loading={registering.isLoading || expecting.isLoading} onClick={() => void registerAndExpect()}>
            Register and expect
          </Button>
        </div>
      )}
      {status === 'registered' && (
        <div className={styles.suggestionAction}>
          <span className={styles.muted}>Registered on {suggestion.equipment?.name}</span>
          <Button size="small" type="primary" loading={expecting.isLoading} onClick={() => void expectRegistered()}>Expect here</Button>
        </div>
      )}
      {status === 'ambiguous' && <span className={styles.muted}>{suggestion.status.label}: fix it in the equipment inventory</span>}
    </div>
  );
}

/**
 * Entries of the computer's device list from the previous agent (PnP IDs with labels, never linked
 * to inventory). Each one becomes a registered hardware ID on the unit a coordinator picks, and an
 * expected device on this computer, so the agent watches it. Done entries are hidden.
 */
export function LegacyDeviceSuggestions({ computingId }: { computingId: number }) {
  const { data } = useGetLegacyDeviceSuggestionsQuery(computingId);
  const open = (data ?? []).filter((item) => item.status.value !== 'expected');
  if (open.length === 0) return null;
  return (
    <section className={styles.suggestions} aria-labelledby="legacy-suggestions-title">
      <h2 id="legacy-suggestions-title" className={styles.panelTitle}>From the previous device list · {open.length}</h2>
      <span className={styles.footnote}>
        The previous agent watched these PnP IDs on this computer. Pick the unit each one is to register its ID and expect it here.
      </span>
      {open.map((item) => <SuggestionRow key={item.pnp_id} computingId={computingId} suggestion={item} />)}
    </section>
  );
}
