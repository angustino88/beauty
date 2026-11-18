import { useMemo, useState } from 'react';
import { Alert, Input, InputNumber, Modal, Segmented, Select, Switch, message } from 'antd';
import type { LicenseCheckRead, LicenseCheckWrite } from '@/shared/api/generated/api';
import { useCreateLicenseCheckMutation, useGetLicenseCheckPresetsQuery, useUpdateLicenseCheckMutation } from './api';
import { TargetPicker } from './TargetPicker';
import type { PickedTarget } from './targets';
import styles from './LicenseChecks.module.css';

type Source = 'preset' | 'custom';

const CONFIG_FIELDS = ['probe', 'extract', 'carrier'] as const;
type ConfigField = (typeof CONFIG_FIELDS)[number];

const CONFIG_LABELS: Record<ConfigField, string> = {
  probe: 'Probe (what the agent runs or reads)',
  extract: 'Extraction (how licenses are read from the output)',
  carrier: 'Carrier (what holds the licenses)',
};

/** Field errors of a standard API problem response, as one readable line. */
function problemMessage(error: unknown, fallback: string): string {
  const body = (error as { data?: { error?: { message?: string; details?: { field?: string; message?: string }[] } } } | undefined)?.data;
  const details = body?.error?.details ?? [];
  const fields = details.map((item) => (item.field ? `${item.field}: ${item.message}` : item.message)).filter(Boolean);
  return [body?.error?.message, ...fields].filter(Boolean).join(' · ') || fallback;
}

function toTargets(check?: LicenseCheckRead): PickedTarget[] {
  return (check?.targets ?? []).map((target) => ({
    kind: target.kind.value as PickedTarget['kind'],
    target_id: target.id,
    name: target.name,
  }));
}

const pretty = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

interface CheckFormModalProps {
  open: boolean;
  /** Edit this check; create a new one when absent. */
  check?: LicenseCheckRead;
  isAdmin: boolean;
  onClose: () => void;
}

/**
 * Create a check (from a preset or from scratch) or change one. What the agent runs (vendor,
 * probe, extraction, carrier) is for administrators; coordinators change name, schedule, targets.
 */
export function CheckFormModal(props: CheckFormModalProps) {
  if (!props.open) return null;
  // A fresh form per check: state starts from the check instead of being reset in an effect.
  return <CheckFormDialog key={props.check?.id ?? 'new'} {...props} />;
}

function CheckFormDialog({ open, check, isAdmin, onClose }: CheckFormModalProps) {
  const presets = useGetLicenseCheckPresetsQuery(undefined, { skip: !open || Boolean(check) });
  const [create, creating] = useCreateLicenseCheckMutation();
  const [update, updating] = useUpdateLicenseCheckMutation();
  const [source, setSource] = useState<Source>(check ? 'custom' : 'preset');
  const [presetKey, setPresetKey] = useState<string>();
  const [key, setKey] = useState(check?.key ?? '');
  const [name, setName] = useState(check?.name ?? '');
  const [vendor, setVendor] = useState(check?.vendor ?? '');
  const [interval, setInterval] = useState<number>(check?.interval_minutes ?? 360);
  const [isLabWide, setIsLabWide] = useState(check?.is_lab_wide ?? false);
  const [targets, setTargets] = useState<PickedTarget[]>(() => toTargets(check));
  const [config, setConfig] = useState<Record<ConfigField, string>>(() => ({
    probe: pretty(check?.probe),
    extract: pretty(check?.extract),
    carrier: pretty(check?.carrier),
  }));

  const preset = useMemo(() => (presets.data ?? []).find((item) => item.key === presetKey), [presets.data, presetKey]);

  const parsedConfig = (): Record<ConfigField, unknown> | null => {
    const parsed: Partial<Record<ConfigField, unknown>> = {};
    for (const field of CONFIG_FIELDS) {
      try {
        parsed[field] = JSON.parse(config[field]);
      } catch {
        message.error(`${CONFIG_LABELS[field]} is not valid JSON`);
        return null;
      }
    }
    return parsed as Record<ConfigField, unknown>;
  };

  const submit = async () => {
    const shared: LicenseCheckWrite = {
      name: name.trim() || undefined,
      interval_minutes: interval,
      is_lab_wide: isLabWide,
      targets: targets.map(({ kind, target_id }) => ({ kind, target_id })),
    };
    let body: LicenseCheckWrite = shared;
    if (!check && source === 'preset') {
      if (!presetKey) return;
      body = { ...shared, preset_key: presetKey, key: key.trim() || undefined, interval_minutes: undefined };
    } else if (isAdmin) {
      const parsed = parsedConfig();
      if (!parsed) return;
      body = { ...shared, ...parsed, vendor: vendor.trim(), key: check ? undefined : key.trim() };
    }
    try {
      if (check) await update({ checkId: check.id, changes: body }).unwrap();
      else await create(body).unwrap();
      message.success(check ? 'License check saved' : 'License check created');
      onClose();
    } catch (error) {
      message.error(problemMessage(error, 'Could not save the license check'));
    }
  };

  const usesPreset = !check && source === 'preset';
  const canSubmit = usesPreset ? Boolean(presetKey) : Boolean(name.trim()) && (Boolean(check) || Boolean(key.trim()));

  return (
    <Modal
      open={open}
      title={check ? `Edit ${check.name}` : 'New license check'}
      okText={check ? 'Save' : 'Create'}
      onOk={() => void submit()}
      okButtonProps={{ disabled: !canSubmit, loading: creating.isLoading || updating.isLoading }}
      onCancel={onClose}
      width={720}
      destroyOnHidden
    >
      <div className={styles.form}>
        {!check && (
          <Segmented<Source>
            value={source}
            onChange={setSource}
            options={[{ value: 'preset', label: 'From a preset' }, { value: 'custom', label: 'Custom' }]}
          />
        )}
        {usesPreset && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Preset</span>
            <Select
              aria-label="Preset"
              placeholder="Pick a preset"
              loading={presets.isFetching}
              value={presetKey}
              onChange={setPresetKey}
              options={(presets.data ?? []).map((item) => ({ value: item.key, label: `${item.name} · ${item.vendor}` }))}
            />
            {preset && <span className={styles.muted}>{preset.description}</span>}
          </div>
        )}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Key</span>
          <Input
            aria-label="Key"
            className={styles.mono}
            value={key}
            disabled={Boolean(check)}
            placeholder={usesPreset ? preset?.key ?? 'Defaults to the preset key' : 'vector-license-client'}
            onChange={(event) => setKey(event.target.value)}
          />
          <span className={styles.muted}>Lowercase letters, digits, - and _. The agent reports runs under this key; it cannot change.</span>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <Input aria-label="Name" value={name} placeholder={preset?.name} onChange={(event) => setName(event.target.value)} />
        </div>
        {!usesPreset && (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Run every (minutes)</span>
            <InputNumber aria-label="Interval in minutes" min={15} max={10080} value={interval} onChange={(value) => setInterval(value ?? 360)} />
          </div>
        )}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Runs on</span>
          <label className={styles.toolbarGroup}>
            <Switch checked={isLabWide} onChange={setIsLabWide} aria-label="Every computer" /> Every computer with an agent
          </label>
          {!isLabWide && <TargetPicker value={targets} onChange={setTargets} />}
          {!isLabWide && targets.length === 0 && (
            <span className={styles.muted}>No target yet: the check runs nowhere until you add one.</span>
          )}
        </div>
        {!usesPreset && (
          isAdmin ? (
            <>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Vendor</span>
                <Input aria-label="Vendor" value={vendor} onChange={(event) => setVendor(event.target.value)} />
              </div>
              {CONFIG_FIELDS.map((field) => (
                <div className={styles.field} key={field}>
                  <span className={styles.fieldLabel}>{CONFIG_LABELS[field]}</span>
                  <Input.TextArea
                    aria-label={CONFIG_LABELS[field]}
                    className={styles.json}
                    autoSize={{ minRows: 3, maxRows: 14 }}
                    value={config[field]}
                    onChange={(event) => setConfig((prev) => ({ ...prev, [field]: event.target.value }))}
                  />
                </div>
              ))}
              <span className={styles.muted}>
                The agent runs only probes of its closed catalog (command, file, registry) under Program Files or ProgramData, and
                refuses configured paths while its connection is not TLS-verified. Saving a change makes every agent run it again.
              </span>
            </>
          ) : (
            <Alert type="info" showIcon title="Only administrators change what agents run (probe, extraction, carrier)." />
          )
        )}
      </div>
    </Modal>
  );
}
