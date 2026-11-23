import { useState } from 'react';
import { Button, Descriptions, Drawer, Empty, Select, Skeleton, Switch, Timeline, Tooltip } from 'antd';
import { equipmentPagedConfig, usePagedOptions } from '@/shared/hooks/usePagedOptions';
import { InlineAlert, getApiErrorMessage, notify } from '@/shared/notifications';
import dayjs from 'dayjs';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useCreateExpectedDeviceMutation,
  useDeleteExpectedDeviceMutation,
  useGetDeviceConnectionQuery,
  useGetExpectedDevicesQuery,
  useLinkDeviceConnectionMutation,
  useUpdateExpectedDeviceMutation,
} from './devicesApi';
import { deviceConnectionPresentation, historyLabel } from './devicePresentation';
import { ToneBadge } from './DeviceBits';
import styles from './Devices.module.css';

const DATETIME = 'DD MMM YYYY, HH:mm:ss';

function LinkToInventory({ connectionId, hardwareId }: { connectionId: number; hardwareId: string }) {
  const [equipmentId, setEquipmentId] = useState<number>();
  const equipment = usePagedOptions(equipmentPagedConfig);
  const [link, { isLoading }] = useLinkDeviceConnectionMutation();

  const submit = async () => {
    if (!equipmentId) return;
    try {
      const result = await link({ connectionId, equipmentId }).unwrap();
      if (result.match_status.value === 'matched') {
        notify.success('Device linked to inventory');
      } else {
        notify.success('Hardware ID registered', {
          description: `Current match status: ${result.match_status.label.toLowerCase()}.`,
        });
      }
      setEquipmentId(undefined);
    } catch (error) {
      notify.error('Unable to link device', {
        description: getApiErrorMessage(error, 'Please try again.'),
      });
    }
  };

  return (
    <section className={styles.matchCard} aria-labelledby="link-title">
      <h3 id="link-title" className={styles.panelTitle}>Match to inventory</h3>
      <span className={styles.footnote}>
        No equipment unit has the hardware ID <span className={styles.mono} style={{ overflowWrap: 'anywhere' }}>{hardwareId}</span>.
        Link this device to the unit it is: the ID is registered on that unit and the agent watches it from its next policy
        sync. An ID already registered on another unit is never moved.
      </span>
      <Select
        allowClear
        placeholder="Search equipment by name or SKU"
        aria-label="Equipment to link"
        value={equipmentId}
        onChange={setEquipmentId}
        {...equipment.selectProps}
        options={equipment.options}
      />
      <div>
        <Button type="primary" onClick={() => void submit()} loading={isLoading} disabled={!equipmentId}>
          Link and register ID
        </Button>
      </div>
    </section>
  );
}

function ExpectationControls({
  computingId,
  computingName,
  equipmentId,
  expectedDeviceId,
}: {
  computingId: number;
  computingName: string;
  equipmentId: number;
  expectedDeviceId: number | null;
}) {
  const expectations = useGetExpectedDevicesQuery(
    expectedDeviceId ? { computingId, pageSize: 100 } : skipToken,
  );
  const expected = expectations.data?.data.find((row) => row.id === expectedDeviceId);
  const [create, creating] = useCreateExpectedDeviceMutation();
  const [remove, removing] = useDeleteExpectedDeviceMutation();
  const [update, updating] = useUpdateExpectedDeviceMutation();

  const toggleExpected = async (checked: boolean) => {
    try {
      if (checked) await create({ computingId, equipmentId, isDisconnectAlertEnabled: false }).unwrap();
      else if (expectedDeviceId) await remove(expectedDeviceId).unwrap();
    } catch (error) {
      notify.error('Unable to update device expectation', {
        description: getApiErrorMessage(error, 'Please try again.'),
      });
    }
  };
  const toggleAlert = async (checked: boolean) => {
    if (!expectedDeviceId) return;
    try {
      await update({ expectedDeviceId, isDisconnectAlertEnabled: checked }).unwrap();
    } catch (error) {
      notify.error('Unable to update disconnect alert', {
        description: getApiErrorMessage(error, 'Please try again.'),
      });
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="expect-title">
      <h3 id="expect-title" className={styles.panelTitle}>Expectation and alerts</h3>
      <label className={styles.switchRow}>
        <span>Expect this device on {computingName}<span className={styles.drawerSubtitle}>Flags it as missing when the agent reports without it.</span></span>
        <Switch checked={Boolean(expectedDeviceId)} loading={creating.isLoading || removing.isLoading} onChange={(checked) => void toggleExpected(checked)} />
      </label>
      <label className={styles.switchRow}>
        <span>Alert me when it disconnects<span className={styles.drawerSubtitle}>An in-app notification to you, once per disconnect.</span></span>
        <Switch
          checked={Boolean(expected?.is_disconnect_alert_enabled)}
          disabled={!expectedDeviceId}
          loading={updating.isLoading || expectations.isFetching}
          onChange={(checked) => void toggleAlert(checked)}
        />
      </label>
    </section>
  );
}

export function DeviceDetailDrawer({ connectionId, onClose }: { connectionId: number | null; onClose: () => void }) {
  const { data: connection, isFetching, isError, refetch } = useGetDeviceConnectionQuery(connectionId ?? skipToken, {
    pollingInterval: connectionId ? 30_000 : 0,
    skipPollingIfUnfocused: true,
  });
  const presentation = connection ? deviceConnectionPresentation(connection) : null;
  const subtitle = connection ? [connection.computing.name, connection.bench?.name ? `Bench ${connection.bench.name}` : ''].filter(Boolean).join(' · ') : '';

  return (
    <Drawer
      open={connectionId !== null}
      onClose={onClose}
      size={480}
      destroyOnHidden
      title={
        <span>
          <span className={styles.drawerSubtitle}>{subtitle || 'Device'}</span>
          {presentation?.title ?? 'Loading device'}
        </span>
      }
      footer={<span className={styles.footnote}>Connection state comes from the computing agent. Inventory changes only when you link a device.</span>}
    >
      {isError && !connection && (
        <InlineAlert
          variant="error"
          title="Unable to load device details"
          onRetry={() => void refetch()}
        />
      )}
      {!connection && isFetching && <Skeleton active paragraph={{ rows: 8 }} />}
      {connection && presentation && (
        <div className={styles.drawerBody}>
          <div className={styles.tags}>
            <ToneBadge tone={presentation.connectionTone} label={presentation.connectionLabel} />
            <ToneBadge tone={presentation.freshnessTone} label={presentation.freshnessLabel} title={presentation.freshnessDescription} />
            <ToneBadge tone={presentation.matchTone} label={presentation.matchLabel} title={presentation.matchDescription} />
          </div>

          {presentation.canLink && <LinkToInventory connectionId={connection.id} hardwareId={presentation.hardwareId} />}
          {presentation.inventoryFix && (
            <InlineAlert variant="warning" title="Fix this in the equipment inventory" description={presentation.inventoryFix} />
          )}
          {connection.match_status.value === 'unmatched' && !presentation.hardwareId && (
            <InlineAlert variant="info" title="This device reported no hardware ID" description="It cannot be linked to inventory until the agent reports its PnP ID." />
          )}

          <section className={styles.panel} aria-labelledby="evidence-title">
            <h3 id="evidence-title" className={styles.panelTitle}>Reported evidence</h3>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Reported name">{connection.name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Inventory">{connection.equipment ? connection.equipment.name : presentation.matchDescription}</Descriptions.Item>
              <Descriptions.Item label="Hardware IDs">
                {(connection.hardware_ids ?? []).length === 0 ? '—' : (connection.hardware_ids ?? []).map((id) => (
                  <div key={`${id.kind}:${id.value}`} className={styles.mono} style={{ overflowWrap: 'anywhere' }}>{id.value}</div>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="Interface">{connection.interface?.name || connection.interface_name}</Descriptions.Item>
              <Descriptions.Item label="Collector"><span className={styles.mono}>{connection.collector_key}</span></Descriptions.Item>
              <Descriptions.Item label="Instance key"><span className={styles.mono} style={{ overflowWrap: 'anywhere' }}>{connection.observation_key}</span></Descriptions.Item>
              <Descriptions.Item label="First received">{dayjs(connection.first_seen_at).format(DATETIME)}</Descriptions.Item>
              <Descriptions.Item label="Last observed">
                <Tooltip title={`Received ${dayjs(connection.received_at).format(DATETIME)}`}>
                  <time dateTime={connection.observed_at}>{dayjs(connection.observed_at).format(DATETIME)}</time>
                </Tooltip>
              </Descriptions.Item>
            </Descriptions>
          </section>

          <section className={styles.panel} aria-labelledby="history-title">
            <h3 id="history-title" className={styles.panelTitle}>Connection history</h3>
            {connection.history.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No history in recent reports" />
            ) : (
              <Timeline
                items={connection.history.map((change) => ({
                  color: change.state.value === 'connected' ? 'green' : 'gray',
                  content: (
                    <div>
                      <div style={{ fontWeight: 600 }}>{historyLabel(change)}</div>
                      <div className={styles.muted}>{dayjs(change.observed_at).format(DATETIME)}</div>
                    </div>
                  ),
                }))}
              />
            )}
          </section>

          {connection.equipment && (
            <ExpectationControls
              computingId={connection.computing.id}
              computingName={connection.computing.name}
              equipmentId={connection.equipment.id}
              expectedDeviceId={connection.expected_device_id}
            />
          )}
        </div>
      )}
    </Drawer>
  );
}
