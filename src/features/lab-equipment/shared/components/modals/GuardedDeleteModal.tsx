import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Checkbox, Input, Modal, Space, Tag, Typography } from 'antd';
import { LinkOutlined, SettingOutlined } from '@ant-design/icons';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  Cpu,
  KeyRound,
  Server,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { EQUIPMENT_CATEGORIES } from '../../../categories/registry';
import type { EquipmentCategoryKey } from '../../../types/equipment';
import {
  parseBlockedDeleteError,
  type BlockedDeleteEntry,
  type BlockedDeleteGroup,
  type ParsedBlockedDeleteError,
} from '../../utils/deleteBlockers';
import styles from './DeleteModal.module.css';

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

interface ForceEffectItem {
  title: string;
  detail: string;
}

interface ResourceCopy {
  singular: string;
  preconditionHint: string;
  forceEffects: ForceEffectItem[];
  childStatusSummary: string;
  reasonPlaceholder: string;
}

const RESOURCE_ICONS: Record<GuardedDeleteResourceKind, React.ReactNode> = {
  room: <Building2 size={13} />,
  station: <Server size={13} />,
  bench: <Cpu size={13} />,
  license: <KeyRound size={13} />,
};

const RESOURCE_COPY: Record<GuardedDeleteResourceKind, ResourceCopy> = {
  room: {
    singular: 'Room',
    preconditionHint:
      'Rooms cannot be standard-deleted while stations or resting equipment remain placed inside. To stop using this room without removing it, retire it via Change lifecycle instead.',
    forceEffects: [
      {
        title: 'Detach all child stations',
        detail: 'Room & slot links are cleared; each station keeps its lifecycle status and appears as "Needs placement" in Space Mapping.',
      },
      {
        title: 'Clear resting equipment placements',
        detail: 'Any equipment kept directly in this room is detached and stays In service / Available.',
      },
      {
        title: 'Close downtime, log audit & soft-delete',
        detail: 'Open room downtime windows are closed, an operator audit entry is recorded, and the room is soft-deleted.',
      },
    ],
    childStatusSummary:
      'Child stations keep their lifecycle status (detached / Needs placement); resting equipment stays In service / Available.',
    reasonPlaceholder: 'e.g., Lab room decommissioned for renovation or duplicate room record',
  },
  station: {
    singular: 'Station',
    preconditionHint:
      'Stations cannot be standard-deleted while configured benches or resting equipment remain placed here. To stop using this station without removing it, retire it via Change lifecycle instead.',
    forceEffects: [
      {
        title: 'Detach all child benches',
        detail: 'Station & slot links are cleared; each bench keeps its lifecycle status and appears as "Needs placement" in Space Mapping.',
      },
      {
        title: 'Clear resting equipment & release room slot',
        detail: 'Resting equipment stays In service / Available, and this station’s room slot is freed immediately.',
      },
      {
        title: 'Close downtime, log audit & soft-delete',
        detail: 'Open station downtime windows are closed, an operator audit entry is recorded, and the station is soft-deleted.',
      },
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
      {
        title: 'Unassign all bench equipment',
        detail: 'Assigned equipment stays In service and its display status returns to Available.',
      },
      {
        title: 'Cancel all active bench bookings',
        detail: 'Active and upcoming bookings are cancelled with your operator audit reason attached.',
      },
      {
        title: 'Release station slot, log audit & soft-delete',
        detail: 'Station slot is freed, open downtime windows are closed, an operator audit entry is recorded, and the bench is soft-deleted.',
      },
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
  const confirmToken = item.sku?.trim() || item.name?.trim() || `#${item.id}`;
  const targetSearchToken = item.sku?.trim() || item.name?.trim() || '';
  const trimmedReason = reason.trim();
  const tokenMatched = typedConfirm.trim() === confirmToken;
  const canProceedForce =
    supportsForceDelete &&
    trimmedReason.length >= REASON_MIN_LENGTH &&
    trimmedReason.length <= REASON_MAX_LENGTH &&
    tokenMatched &&
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
      <div key={group.key} className={styles.blockerCard}>
        <div className={styles.blockerHeader}>
          <div className={styles.blockerTitleWrap}>
            <span className={styles.blockerTitle}>{meta.title}</span>
            <span className={styles.blockerCount}>{group.total}</span>
          </div>
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
          <div>
            {group.entries.map((entry, idx) => {
              const { path, categoryLabel } = buildEntryLink(group.key, entry);
              return (
                <div key={`${entry.label}-${idx}`} className={styles.blockerRow}>
                  <div className={styles.blockerRowLeft}>
                    {entry.sku && <span className={styles.skuPill}>{entry.sku}</span>}
                    {path ? (
                      <button
                        type="button"
                        className={styles.blockerLink}
                        onClick={() => handleNavigate(path)}
                      >
                        {entry.name || entry.sku || entry.label}
                      </button>
                    ) : (
                      <Typography.Text ellipsis>{entry.name || entry.label}</Typography.Text>
                    )}
                  </div>
                  {categoryLabel && (
                    <Tag color="geekblue" style={{ marginInlineEnd: 0, fontSize: 11, flexShrink: 0 }}>
                      {categoryLabel}
                    </Tag>
                  )}
                </div>
              );
            })}
            {remaining > 0 && (
              <div className={styles.blockerMore}>
                …and {remaining} more item{remaining === 1 ? '' : 's'}
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

  const headerTitle = isFinalForceStep
    ? `Confirm force delete`
    : isForce
      ? `Force delete ${copy.singular.toLowerCase()}`
      : isBlocked
        ? `Cannot delete ${copy.singular.toLowerCase()}`
        : `Delete ${copy.singular.toLowerCase()}`;

  const headerSubtitle = isFinalForceStep
    ? `Final operator verification for ${displayLabel}`
    : isForce
      ? `Lab operator override with automatic child detachment & audit logging`
      : isBlocked
        ? `Active dependencies are linked to ${displayLabel}`
        : `Remove ${displayLabel} from active inventory`;

  return (
    <Modal
      open={open}
      onCancel={busy ? undefined : onCancel}
      maskClosable={!busy}
      closable={!busy}
      destroyOnHidden
      width={isBlocked || isForce ? 580 : 480}
      title={
        <div className={styles.modalHeader}>
          <div
            className={`${styles.headerIcon} ${
              isForce ? styles.headerIconDanger : styles.headerIconWarning
            }`}
          >
            {isForce ? <ShieldAlert /> : isBlocked ? <AlertTriangle /> : <Trash2 />}
          </div>
          <div className={styles.headerCopy}>
            <span className={styles.headerTitle}>{headerTitle}</span>
            <span className={styles.headerSubtitle}>{headerSubtitle}</span>
          </div>
        </div>
      }
      footer={
        <div className={styles.footerRow}>
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
                type="text"
                size="small"
                icon={<ArrowLeft size={14} />}
                disabled={busy}
                onClick={() => {
                  setErrorMessage(null);
                  setForceStep(1);
                }}
              >
                Edit details
              </Button>
            ) : isForce ? (
              <Button
                type="text"
                size="small"
                icon={<ArrowLeft size={14} />}
                disabled={busy}
                onClick={() => {
                  setErrorMessage(null);
                  setMode(conflict ? 'blocked' : 'standard');
                }}
              >
                {conflict ? 'Back to blockers' : 'Standard delete'}
              </Button>
            ) : null}
          </div>

          <Space size={8}>
            <Button onClick={onCancel} disabled={busy}>
              {isBlocked ? 'Close' : 'Cancel'}
            </Button>
            {mode === 'standard' && (
              <Button type="primary" danger loading={deleting} onClick={() => void handleConfirm()}>
                Delete {copy.singular}
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
                Review & confirm
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
                Confirm force delete
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <div className={styles.bodyStack}>
        {isForce && (
          <div className={styles.stepper} role="list" aria-label="Force delete confirmation steps">
            <div
              role="listitem"
              className={`${styles.stepItem} ${isFinalForceStep ? styles.stepDone : styles.stepActive}`}
            >
              <span className={styles.stepBadge}>
                {isFinalForceStep ? <Check /> : '1'}
              </span>
              <span>Impact &amp; audit details</span>
            </div>
            <div
              role="listitem"
              className={`${styles.stepItem} ${isFinalForceStep ? styles.stepActive : ''}`}
            >
              <span className={styles.stepBadge}>2</span>
              <span>Final confirmation</span>
            </div>
          </div>
        )}

        <div className={styles.identityCard}>
          <div className={styles.identityLeft}>
            <span className={styles.identityEyebrow}>
              {RESOURCE_ICONS[resourceKind]}
              <span>{copy.singular}</span>
            </span>
            <span className={styles.identityName}>{item.name || item.sku || `${copy.singular} #${item.id}`}</span>
          </div>
          <div className={styles.identityMeta}>
            {item.sku && <span className={styles.skuPill}>{item.sku}</span>}
            <span className={styles.idPill}>#{item.id}</span>
          </div>
        </div>

        {mode === 'standard' && <p className={styles.hintCopy}>{copy.preconditionHint}</p>}

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
            <div className={styles.impactCard}>
              <div className={styles.impactHeader}>
                <AlertTriangle />
                <span>Immediate side effects of force-deleting {displayLabel}</span>
              </div>
              <ul className={styles.impactList}>
                {copy.forceEffects.map((effect) => (
                  <li key={effect.title} className={styles.impactRow}>
                    <span className={styles.impactDot} aria-hidden="true" />
                    <div className={styles.impactText}>
                      <span className={styles.impactTitle}>{effect.title}</span>
                      <span className={styles.impactDetail}>{effect.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <span className={styles.fieldLabel}>
                  Audit reason<span className={styles.requiredMark}>*</span>
                </span>
                <span className={styles.fieldHint}>Recorded in resource change history (min 3 chars)</span>
              </div>
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

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <span className={styles.fieldLabel}>
                  Type <span className={styles.tokenChip}>{confirmToken}</span> to confirm
                  <span className={styles.requiredMark}>*</span>
                </span>
                {tokenMatched && (
                  <span className={styles.matchBadge}>
                    <Check /> Matched
                  </span>
                )}
              </div>
              <Input
                placeholder={`Enter ${confirmToken}`}
                value={typedConfirm}
                onChange={(event) => setTypedConfirm(event.target.value)}
                disabled={busy}
                autoComplete="off"
                status={typedConfirm.length > 0 && !tokenMatched ? 'warning' : undefined}
              />
            </div>

            <label
              className={`${styles.ackCard} ${acknowledged ? styles.ackCardChecked : ''}`}
            >
              <Checkbox
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                disabled={busy}
              />
              <span className={styles.ackCopy}>
                I confirm as a lab operator that I understand how child resources will be detached or
                unassigned and want to force-delete <strong>{displayLabel}</strong>.
              </span>
            </label>
          </>
        )}

        {isFinalForceStep && (
          <>
            <div className={styles.dangerBanner} role="status">
              <ShieldAlert />
              <div>
                <div className={styles.dangerBannerTitle}>Permanent operator override</div>
                <div className={styles.dangerBannerCopy}>
                  This immediately removes <strong>{displayLabel}</strong> from active lab inventory and
                  cannot be undone from the UI.
                </div>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Target {copy.singular.toLowerCase()}</span>
                <span className={styles.reviewValue}>
                  <span className={styles.skuPill}>{confirmToken}</span>{' '}
                  {item.name && item.name !== confirmToken ? item.name : null}
                </span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Child impact</span>
                <span className={styles.reviewValue}>{copy.childStatusSummary}</span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Audit reason</span>
                <div className={styles.reasonQuote}>{trimmedReason}</div>
              </div>
            </div>
          </>
        )}

        {errorMessage && (
          <div className={styles.errorBox} role="alert">
            <AlertTriangle />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GuardedDeleteModal;
