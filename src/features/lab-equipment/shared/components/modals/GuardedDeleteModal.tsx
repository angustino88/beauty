import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Checkbox, Descriptions, Input, Modal, Space, Tag, Typography } from 'antd';
import {
  ExclamationCircleOutlined,
  ExportOutlined,
  LinkOutlined,
  SettingOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { EQUIPMENT_CATEGORIES } from '../../../categories/registry';
import type { EquipmentCategoryKey } from '../../../types/equipment';
import {
  parseBlockedDeleteError,
  type BlockedDeleteEntry,
  type BlockedDeleteGroup,
  type ParsedBlockedDeleteError,
} from '../../utils/deleteBlockers';

export type GuardedDeleteResourceKind = 'room' | 'station' | 'bench' | 'license';
export type GuardedDeleteInitialMode = 'standard' | 'force';

export interface GuardedDeleteTarget {
  id: number;
  sku?: string | null;
  name?: string | null;
}

export interface GuardedDeleteAttemptResult {
  ok: boolean;
  error?: unknown;
}

export interface GuardedForceDeleteResult {
  ok: boolean;
  error?: string;
}

export interface GuardedDeleteModalProps {
  open: boolean;
  resourceKind: GuardedDeleteResourceKind;
  item: GuardedDeleteTarget | null;
  initialMode?: GuardedDeleteInitialMode;
  deleting: boolean;
  forceDeleting?: boolean;
  onCancel: () => void;
  onConfirm: (id: number) => Promise<GuardedDeleteAttemptResult>;
  onForceDelete?: (id: number, reason: string) => Promise<GuardedForceDeleteResult>;
  /** Optional quick action for bench equipment blockers to open the inline assignment modal. */
  onManageEquipment?: () => void;
}

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

interface ResourceCopy {
  singular: string;
  preconditionHint: string;
  forceEffects: string[];
  childStatusSummary: string;
  reasonPlaceholder: string;
}

const RESOURCE_COPY: Record<GuardedDeleteResourceKind, ResourceCopy> = {
  room: {
    singular: 'Room',
    preconditionHint:
      'Rooms cannot be standard-deleted while stations or resting equipment are still placed inside. If you want to stop using this room without removing it, consider retiring it via Change lifecycle instead.',
    forceEffects: [
      'Detach all child stations from this room (room & slot cleared; station lifecycle status stays unchanged and shows as "Needs placement" in Space Mapping)',
      'Clear any resting equipment placements directly in this room (equipment stays In service / Available)',
      'Close open downtime windows on this room, record an operator audit entry, and soft-delete the room',
    ],
    childStatusSummary:
      'Child stations keep their lifecycle status (detached / Needs placement); resting equipment stays In service / Available.',
    reasonPlaceholder: 'e.g., Lab room decommissioned for renovation or duplicate room record',
  },
  station: {
    singular: 'Station',
    preconditionHint:
      'Stations cannot be standard-deleted while configured benches or resting equipment are still placed here. If you want to stop using this station without removing it, consider retiring it via Change lifecycle instead.',
    forceEffects: [
      'Detach all child benches from this station (station & slot cleared; bench lifecycle status stays unchanged and shows as "Needs placement" in Space Mapping)',
      'Clear any resting equipment placements directly at this station (equipment stays In service / Available)',
      'Release this station’s room slot, close open downtime windows, record an operator audit entry, and soft-delete the station',
    ],
    childStatusSummary:
      'Child benches keep their lifecycle status (detached / Needs placement); resting equipment stays In service / Available.',
    reasonPlaceholder: 'e.g., Rack/station removed from lab floor or replaced by new station',
  },
  bench: {
    singular: 'Bench',
    preconditionHint:
      'Benches cannot be standard-deleted while equipment is assigned or active bookings exist. Move equipment and cancel active bookings first, or retire the bench via Change lifecycle.',
    forceEffects: [
      'Unassign all assigned equipment from this bench (equipment stays In service and display status becomes Available)',
      'Cancel all active bench bookings with your force-delete reason',
      'Release this bench’s station slot, close open downtime windows, record an operator audit entry, and soft-delete the bench',
    ],
    childStatusSummary:
      'Assigned equipment becomes unassigned (status → Available); active bench bookings are cancelled.',
    reasonPlaceholder: 'e.g., Test bench dismantled for hardware refresh or merged into another bench',
  },
  license: {
    singular: 'License',
    preconditionHint:
      'Licenses cannot be deleted while seats are still assigned to equipment. Unassign the license from all equipment first.',
    forceEffects: [],
    childStatusSummary: '',
    reasonPlaceholder: '',
  },
};

function isKnownCategoryKey(key: string | null): key is EquipmentCategoryKey {
  return Boolean(key && Object.prototype.hasOwnProperty.call(EQUIPMENT_CATEGORIES, key));
}

function buildEntryLink(groupKey: string, entry: BlockedDeleteEntry): { path: string | null; categoryLabel: string | null } {
  const token = entry.sku || entry.name || entry.label;
  const encoded = encodeURIComponent(token);

  switch (groupKey) {
    case 'stations':
      return { path: `/spaces/station?q=${encoded}`, categoryLabel: 'Station' };
    case 'benches':
      return { path: `/spaces/bench?q=${encoded}`, categoryLabel: 'Bench' };
    case 'bookings':
      return { path: '/booking-calendar', categoryLabel: 'Booking' };
    case 'equipment': {
      if (isKnownCategoryKey(entry.categoryKey)) {
        const category = EQUIPMENT_CATEGORIES[entry.categoryKey];
        return {
          path: `/lab-equipment/${entry.categoryKey}?q=${encoded}`,
          categoryLabel: category.label,
        };
      }
      return {
        path: `/spaces/mapping?q=${encoded}`,
        categoryLabel: 'Equipment',
      };
    }
    default:
      return { path: null, categoryLabel: null };
  }
}

interface BlockerGroupMeta {
  title: string;
  actionLabel: string;
  actionPath: string;
}

function getBlockerGroupMeta(
  resourceKind: GuardedDeleteResourceKind,
  groupKey: string,
  targetSearchToken: string,
): BlockerGroupMeta {
  const mappingFilteredPath = targetSearchToken
    ? `/spaces/mapping?q=${encodeURIComponent(targetSearchToken)}`
    : '/spaces/mapping';

  switch (groupKey) {
    case 'stations':
      return {
        title: 'Stations in this room',
        actionLabel: 'Open in Mapping',
        actionPath: mappingFilteredPath,
      };
    case 'benches':
      return {
        title: 'Configured benches on this station',
        actionLabel: 'Open in Mapping',
        actionPath: mappingFilteredPath,
      };
    case 'bookings':
      return {
        title: 'Active bench bookings',
        actionLabel: 'Open Booking Calendar',
        actionPath: '/booking-calendar',
      };
    case 'equipment':
      if (resourceKind === 'license') {
        return {
          title: 'Equipment holding seats of this license',
          actionLabel: 'Open in Mapping',
          actionPath: mappingFilteredPath,
        };
      }
      return {
        title:
          resourceKind === 'bench'
            ? 'Equipment assigned to this bench'
            : resourceKind === 'station'
              ? 'Equipment kept at this station'
              : 'Equipment kept in this room',
        actionLabel: 'Open in Mapping',
        actionPath: mappingFilteredPath,
      };
    default:
      return {
        title: groupKey,
        actionLabel: 'Open in Mapping',
        actionPath: mappingFilteredPath,
      };
  }
}

export const GuardedDeleteModal: React.FC<GuardedDeleteModalProps> = ({
  open,
  resourceKind,
  item,
  initialMode = 'standard',
  deleting,
  forceDeleting = false,
  onCancel,
  onConfirm,
  onForceDelete,
  onManageEquipment,
}) => {
  const navigate = useNavigate();
  const supportsForceDelete = Boolean(onForceDelete) && resourceKind !== 'license';

  const [mode, setMode] = useState<'standard' | 'blocked' | 'force'>(
    initialMode === 'force' && supportsForceDelete ? 'force' : 'standard',
  );
  const [forceStep, setForceStep] = useState<1 | 2>(1);
  const [conflict, setConflict] = useState<ParsedBlockedDeleteError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  if (!item) return null;

  const copy = RESOURCE_COPY[resourceKind];
  const displayLabel = item.sku || item.name || `${copy.singular} #${item.id}`;
  const confirmToken = (item.sku?.trim() || item.name?.trim() || `#${item.id}`);
  const targetSearchToken = (item.sku?.trim() || item.name?.trim() || '');
  const trimmedReason = reason.trim();
  const canProceedForce =
    supportsForceDelete &&
    trimmedReason.length >= REASON_MIN_LENGTH &&
    trimmedReason.length <= REASON_MAX_LENGTH &&
    typedConfirm.trim() === confirmToken &&
    acknowledged;
  const busy = deleting || forceDeleting;

  const handleConfirm = async () => {
    setErrorMessage(null);
    const result = await onConfirm(item.id);
    if (result.ok) {
      onCancel();
      return;
    }
    const parsed = parseBlockedDeleteError(
      result.error,
      `Failed to delete ${copy.singular.toLowerCase()}.`,
    );
    if (parsed.isConflict) {
      setConflict(parsed);
      setMode('blocked');
    } else {
      setConflict(null);
      setErrorMessage(parsed.message);
    }
  };

  const handleForceConfirm = async () => {
    if (!onForceDelete || !canProceedForce) return;
    setErrorMessage(null);
    const result = await onForceDelete(item.id, trimmedReason);
    if (result.ok) {
      onCancel();
      return;
    }
    if (result.error) {
      setErrorMessage(result.error);
    }
  };

  const handleNavigate = (path: string) => {
    onCancel();
    void navigate(path);
  };

  const renderGroup = (group: BlockedDeleteGroup) => {
    const meta = getBlockerGroupMeta(resourceKind, group.key, targetSearchToken);
    const remaining = Math.max(0, group.total - group.entries.length);

    return (
      <div
        key={group.key}
        style={{
          border: '1px solid var(--lm-border-subtle, #e5e7eb)',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'var(--lm-surface-elevated, #ffffff)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            padding: '10px 12px',
            background: 'var(--lm-surface-subtle, #fafafa)',
            borderBottom: group.entries.length > 0 ? '1px solid var(--lm-border-subtle, #f0f0f0)' : undefined,
          }}
        >
          <Space size={8}>
            <Typography.Text strong>{meta.title}</Typography.Text>
            <Tag color="orange" style={{ marginInlineEnd: 0 }}>
              {group.total}
            </Tag>
          </Space>
          <Space size={8}>
            {resourceKind === 'bench' && group.key === 'equipment' && onManageEquipment && (
              <Button
                type="default"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => {
                  onCancel();
                  onManageEquipment();
                }}
              >
                Manage equipment
              </Button>
            )}
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              style={{ paddingInline: 0 }}
              onClick={() => handleNavigate(meta.actionPath)}
            >
              {meta.actionLabel}
            </Button>
          </Space>
        </div>

        {group.entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {group.entries.map((entry, idx) => {
              const { path, categoryLabel } = buildEntryLink(group.key, entry);
              const isLast = idx === group.entries.length - 1 && remaining === 0;
              return (
                <div
                  key={`${entry.label}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 12px',
                    borderBottom: isLast ? undefined : '1px solid var(--lm-border-subtle, #f0f0f0)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    {entry.sku && (
                      <Typography.Text code style={{ flexShrink: 0, fontSize: 12 }}>
                        {entry.sku}
                      </Typography.Text>
                    )}
                    {path ? (
                      <Button
                        type="link"
                        size="small"
                        style={{
                          padding: 0,
                          height: 'auto',
                          textAlign: 'left',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => handleNavigate(path)}
                      >
                        {entry.name || entry.sku || entry.label}
                      </Button>
                    ) : (
                      <Typography.Text ellipsis>{entry.name || entry.label}</Typography.Text>
                    )}
                  </div>
                  <Space size={6} style={{ flexShrink: 0 }}>
                    {categoryLabel && (
                      <Tag color="geekblue" style={{ marginInlineEnd: 0, fontSize: 11 }}>
                        {categoryLabel}
                      </Tag>
                    )}
                    {path && (
                      <Button
                        type="text"
                        size="small"
                        icon={<ExportOutlined />}
                        aria-label={`Open ${entry.label}`}
                        onClick={() => handleNavigate(path)}
                      />
                    )}
                  </Space>
                </div>
              );
            })}
            {remaining > 0 && (
              <div style={{ padding: '7px 12px', background: 'var(--lm-surface-subtle, #fafafa)' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  …and {remaining} more item{remaining === 1 ? '' : 's'}
                </Typography.Text>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const isBlocked = mode === 'blocked' && conflict !== null;
  const isForce = mode === 'force';
  const isFinalForceStep = isForce && forceStep === 2;

  return (
    <Modal
      open={open}
      onCancel={busy ? undefined : onCancel}
      maskClosable={!busy}
      closable={!busy}
      destroyOnHidden
      width={isBlocked || isForce ? 600 : 480}
      title={
        <Space size={8}>
          {isForce ? (
            <WarningOutlined style={{ color: 'var(--lm-danger-solid, #ff4d4f)' }} />
          ) : isBlocked ? (
            <StopOutlined style={{ color: 'var(--lm-warning-solid, #faad14)' }} />
          ) : (
            <ExclamationCircleOutlined style={{ color: 'var(--lm-warning-solid, #faad14)' }} />
          )}
          <span>
            {isFinalForceStep
              ? `Final confirmation: Force delete ${displayLabel}`
              : isForce
                ? `Force delete ${displayLabel}`
                : isBlocked
                  ? `Cannot delete ${displayLabel}`
                  : `Delete ${displayLabel}?`}
          </span>
          {isForce && (
            <Tag color={isFinalForceStep ? 'red' : 'volcano'} style={{ marginInlineStart: 4 }}>
              Step {forceStep} of 2
            </Tag>
          )}
        </Space>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            {mode === 'standard' && supportsForceDelete ? (
              <Button
                type="link"
                danger
                size="small"
                style={{ paddingInline: 0 }}
                disabled={busy}
                onClick={() => {
                  setErrorMessage(null);
                  setForceStep(1);
                  setMode('force');
                }}
              >
                Need to force delete?
              </Button>
            ) : isFinalForceStep ? (
              <Button
                type="link"
                size="small"
                style={{ paddingInline: 0 }}
                disabled={busy}
                onClick={() => {
                  setErrorMessage(null);
                  setForceStep(1);
                }}
              >
                Back to edit details
              </Button>
            ) : isForce ? (
              <Button
                type="link"
                size="small"
                style={{ paddingInline: 0 }}
                disabled={busy}
                onClick={() => {
                  setErrorMessage(null);
                  setMode(conflict ? 'blocked' : 'standard');
                }}
              >
                {conflict ? 'Back to blockers' : 'Back to standard delete'}
              </Button>
            ) : null}
          </div>

          <Space>
            <Button onClick={onCancel} disabled={busy}>
              {isBlocked ? 'Close' : 'Cancel'}
            </Button>
            {mode === 'standard' && (
              <Button type="primary" danger loading={deleting} onClick={() => void handleConfirm()}>
                Delete
              </Button>
            )}
            {isBlocked && (
              <>
                <Button loading={deleting} onClick={() => void handleConfirm()}>
                  Try again
                </Button>
                {supportsForceDelete && (
                  <Button
                    type="primary"
                    danger
                    disabled={busy}
                    onClick={() => {
                      setErrorMessage(null);
                      setForceStep(1);
                      setMode('force');
                    }}
                  >
                    Force delete…
                  </Button>
                )}
              </>
            )}
            {isForce && !isFinalForceStep && (
              <Button
                type="primary"
                danger
                disabled={!canProceedForce || busy}
                onClick={() => {
                  setErrorMessage(null);
                  setForceStep(2);
                }}
              >
                Continue to final confirmation
              </Button>
            )}
            {isFinalForceStep && (
              <Button
                type="primary"
                danger
                loading={forceDeleting}
                disabled={!canProceedForce}
                onClick={() => void handleForceConfirm()}
              >
                Yes, force delete permanently
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <Space orientation="vertical" size={14} style={{ width: '100%' }}>
        <Descriptions size="small" column={2} bordered>
          <Descriptions.Item label="SKU">
            <Typography.Text code>{item.sku || '—'}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="ID">#{item.id}</Descriptions.Item>
          <Descriptions.Item label="Name" span={2}>
            {item.name || '—'}
          </Descriptions.Item>
        </Descriptions>

        {mode === 'standard' && (
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {copy.preconditionHint}
          </Typography.Paragraph>
        )}

        {isBlocked && (
          <>
            <Alert
              type="warning"
              showIcon
              title="Resolve linked items before deleting"
              description={conflict.message}
            />
            {conflict.groups.length > 0 && (
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                {conflict.groups.map(renderGroup)}
              </Space>
            )}
            {conflict.groups.length === 0 && (
              <Space wrap>
                {resourceKind === 'room' && (
                  <Button
                    size="small"
                    icon={<LinkOutlined />}
                    onClick={() => handleNavigate('/spaces/station')}
                  >
                    Open Stations
                  </Button>
                )}
                {resourceKind === 'station' && (
                  <Button
                    size="small"
                    icon={<LinkOutlined />}
                    onClick={() => handleNavigate('/spaces/bench')}
                  >
                    Open Benches
                  </Button>
                )}
                {resourceKind === 'bench' && (
                  <Button
                    size="small"
                    icon={<LinkOutlined />}
                    onClick={() => handleNavigate('/booking-calendar')}
                  >
                    Open Booking Calendar
                  </Button>
                )}
                <Button
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={() =>
                    handleNavigate(
                      targetSearchToken
                        ? `/spaces/mapping?q=${encodeURIComponent(targetSearchToken)}`
                        : '/spaces/mapping',
                    )
                  }
                >
                  Open in Mapping
                </Button>
              </Space>
            )}
          </>
        )}

        {isForce && !isFinalForceStep && (
          <>
            <Alert
              type="error"
              showIcon
              title={`Destructive lab operator override — ${copy.singular.toLowerCase()} force delete`}
              description={
                <div style={{ marginTop: 4 }}>
                  <div style={{ marginBottom: 6 }}>
                    Force-deleting <strong>{displayLabel}</strong> will immediately apply the following changes:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {copy.forceEffects.map((effect) => (
                      <li key={effect}>{effect}</li>
                    ))}
                  </ul>
                </div>
              }
            />

            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
                Reason for force delete <Typography.Text type="danger">*</Typography.Text>
              </Typography.Text>
              <Input.TextArea
                rows={2}
                maxLength={REASON_MAX_LENGTH}
                showCount
                placeholder={copy.reasonPlaceholder}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={busy}
              />
            </div>

            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
                Type <Tag style={{ marginInline: 2, fontFamily: 'monospace' }}>{confirmToken}</Tag> to confirm{' '}
                <Typography.Text type="danger">*</Typography.Text>
              </Typography.Text>
              <Input
                placeholder={confirmToken}
                value={typedConfirm}
                onChange={(event) => setTypedConfirm(event.target.value)}
                disabled={busy}
                autoComplete="off"
              />
            </div>

            <Checkbox
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              disabled={busy}
            >
              I confirm as a lab operator that I understand how child resources will be detached/unassigned and
              want to force-delete <strong>{displayLabel}</strong>.
            </Checkbox>
          </>
        )}

        {isFinalForceStep && (
          <>
            <Alert
              type="error"
              showIcon
              title="Final confirmation required"
              description={
                <div>
                  You are about to permanently force-delete <strong>{displayLabel}</strong>. This action cannot
                  be undone from the UI.
                </div>
              }
            />
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Confirmed identifier">
                <Typography.Text code>{confirmToken}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Child impact">{copy.childStatusSummary}</Descriptions.Item>
              <Descriptions.Item label="Audit reason">{trimmedReason}</Descriptions.Item>
            </Descriptions>
          </>
        )}

        {errorMessage && <Alert type="error" showIcon title={errorMessage} />}
      </Space>
    </Modal>
  );
};

export default GuardedDeleteModal;
