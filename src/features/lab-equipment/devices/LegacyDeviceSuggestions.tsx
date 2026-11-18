import { useState } from 'react';
import { Button, Select, Tag, message } from 'antd';
import { skipToken } from '@reduxjs/toolkit/query';
import { useLabsEquipmentOptionsRetrieveQuery, type LegacyDeviceSuggestionRead } from '@/shared/api/generated/api';
import {
  useCreateExpectedDeviceMutation,
  useGetLegacyDeviceSuggestionsQuery,
  useRegisterEquipmentHardwareIdMutation,
} from './devicesApi';
import styles from './Devices.module.css';

function problemMessage(error: unknown, fallback: string): string {
  const body = (error as { data?: { error?: { message?: string } } } | undefined)?.data;
  return body?.error?.message || fallback;
}

function SuggestionRow({ computingId, suggestion }: { computingId: number; suggestion: LegacyDeviceSuggestionRead }) {
  const [search, setSearch] = useState('');
  const [equipmentId, setEquipmentId] = useState<number>();
  const options = useLabsEquipmentOptionsRetrieveQuery(search.trim().length >= 2 ? { q: search.trim() } : skipToken);
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
      message.success('Registered and expected on this computer');
    } catch (error) {
      message.error(problemMessage(error, 'Could not register this device'));
    }
  };

  const expectRegistered = async () => {
    if (!suggestion.equipment) return;
    try {
      await expectOn(suggestion.equipment.id);
      message.success('Expected on this computer');
    } catch (error) {
      message.error(problemMessage(error, 'Could not expect this device'));
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
            showSearch
            allowClear
            size="small"
            placeholder="Which unit is it?"
            aria-label={`Equipment for ${suggestion.label || suggestion.pnp_id}`}
            filterOption={false}
            onSearch={setSearch}
            value={equipmentId}
            onChange={setEquipmentId}
            loading={options.isFetching}
            notFoundContent={search.trim().length < 2 ? 'Type at least 2 characters' : 'No equipment found'}
            options={(options.data?.data ?? []).map((option) => ({
              value: option.id,
              label: option.sku ? `${option.name} · ${option.sku}` : option.name,
            }))}
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
