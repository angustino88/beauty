import { useState } from 'react';
import { Button, Empty, Input, Popconfirm, Segmented, Select, Skeleton, Tag } from 'antd';
import { equipmentPagedConfig, usePagedOptions } from '@/shared/hooks/usePagedOptions';
import { type EquipmentHardwareIdKindEnum } from '@/shared/api/generated/api';
import { InlineAlert, getApiErrorMessage, notify } from '@/shared/notifications';
import {
  useDeleteEquipmentHardwareIdMutation,
  useGetEquipmentHardwareIdsQuery,
  useRegisterEquipmentHardwareIdMutation,
} from './devicesApi';
import { isPortBoundPnpId } from './devicePresentation';
import styles from './Devices.module.css';

const KIND_OPTIONS: { value: EquipmentHardwareIdKindEnum; label: string }[] = [
  { value: 'pnp_id', label: 'PnP ID' },
  { value: 'vector_device', label: 'Vector device' },
];

const PLACEHOLDERS: Record<EquipmentHardwareIdKindEnum, string> = {
  pnp_id: 'USB\\VID_1248&PID_1008\\007113',
  vector_device: '007113-585343',
};

/** Computing unit a port-bound PnP ID is valid on. */
function ComputingSelect({ value, onChange }: { value?: number; onChange: (id?: number) => void }) {
  const equipment = usePagedOptions(equipmentPagedConfig);
  return (
    <Select
      allowClear
      placeholder="Computing unit the device is plugged into"
      aria-label="Computing unit"
      value={value}
      onChange={onChange}
      {...equipment.selectProps}
      options={equipment.options}
    />
  );
}

/**
 * Hardware IDs registered on one equipment unit. The agent on a computer reports a device only
 * when one of these IDs is read from it, so this is how a unit becomes visible to monitoring.
 */
export function EquipmentHardwareIds({ equipmentId, canEdit }: { equipmentId: number; canEdit: boolean }) {
  const { data, isLoading, isError, refetch } = useGetEquipmentHardwareIdsQuery(equipmentId);
  const [register, { isLoading: isSaving }] = useRegisterEquipmentHardwareIdMutation();
  const [remove] = useDeleteEquipmentHardwareIdMutation();
  const [kind, setKind] = useState<EquipmentHardwareIdKindEnum>('pnp_id');
  const [value, setValue] = useState('');
  const [computingId, setComputingId] = useState<number>();

  const portBound = kind === 'pnp_id' && isPortBoundPnpId(value);
  const canSubmit = value.trim().length > 0 && (!portBound || Boolean(computingId));

  const submit = async () => {
    try {
      await register({ equipmentId, kind, value: value.trim(), computing_id: portBound ? computingId : null }).unwrap();
      notify.success('Hardware ID registered');
      setValue('');
      setComputingId(undefined);
    } catch (error) {
      notify.error('Unable to register hardware ID', {
        description: getApiErrorMessage(error, 'Please verify the ID format and try again.'),
      });
    }
  };

  const onDelete = async (hardwareIdId: number) => {
    try {
      await remove({ equipmentId, hardwareIdId }).unwrap();
      notify.success('Hardware ID removed');
    } catch (error) {
      notify.error('Unable to remove hardware ID', {
        description: getApiErrorMessage(error, 'Please try again.'),
      });
    }
  };

  return (
    <section className={`${styles.panel} ${styles.hardwareIds}`} aria-labelledby="hardware-ids-title">
      <h3 id="hardware-ids-title" className={styles.panelTitle}>Hardware IDs</h3>
      <span className={styles.footnote}>
        The IDs the computing agent reads from this unit. It is monitored only on a computer where it is expected and one of
        these IDs is reported. The serial number is a label and is not used for matching.
      </span>
      {isLoading && <Skeleton active paragraph={{ rows: 2 }} />}
      {isError && (
        <InlineAlert
          variant="warning"
          compact
          title="Unable to load hardware IDs"
          onRetry={() => void refetch()}
        />
      )}
      {data && data.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No hardware ID registered. Link a reported device in Lab Monitoring, or add its ID here." />
      )}
      {data && data.length > 0 && (
        <ul className={styles.hardwareIdList} aria-label="Registered hardware IDs">
          {data.map((item) => (
            <li key={item.id} className={styles.hardwareIdRow}>
              <Tag>{item.kind.label}</Tag>
              <span className={styles.mono} style={{ overflowWrap: 'anywhere', flex: 1 }}>{item.value}</span>
              {item.computing && <Tag color="gold" title="Read from a USB port: valid on this computer only">Only on {item.computing.name}</Tag>}
              {canEdit && (
                <Popconfirm
                  title="Remove this hardware ID?"
                  description="The agent stops reporting this device until an ID is registered again."
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDelete(item.id)}
                >
                  <Button size="small" danger type="text" aria-label={`Remove ${item.value}`}>Remove</Button>
                </Popconfirm>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <div className={styles.hardwareIdForm}>
          <Segmented<EquipmentHardwareIdKindEnum> options={KIND_OPTIONS} value={kind} onChange={setKind} aria-label="Hardware ID kind" />
          <Input
            aria-label="Hardware ID value"
            className={styles.mono}
            placeholder={PLACEHOLDERS[kind]}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onPressEnter={() => canSubmit && void submit()}
          />
          {portBound && (
            <>
              <span className={styles.footnote}>
                This PnP ID was made up by Windows from the USB port (the device has no serial), so it is valid on one computer only.
              </span>
              <ComputingSelect value={computingId} onChange={setComputingId} />
            </>
          )}
          <div>
            <Button type="primary" onClick={() => void submit()} loading={isSaving} disabled={!canSubmit}>Add hardware ID</Button>
          </div>
        </div>
      )}
    </section>
  );
}
