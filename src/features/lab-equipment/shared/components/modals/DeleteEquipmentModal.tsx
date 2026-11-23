import React, { useState } from 'react';
import { Button, Checkbox, Input, Modal, Space } from 'antd';
import { AlertTriangle, ArrowLeft, Check, Cpu, ShieldAlert, Trash2 } from 'lucide-react';
import type { EquipmentItem } from '../../../types/equipment';
import styles from './DeleteModal.module.css';

export type DeleteModalMode = 'standard' | 'force';

export interface DeleteEquipmentAttemptResult {
  blocked?: string[];
  error?: string;
}

export interface DeleteEquipmentModalProps {
  open: boolean;
  item: EquipmentItem | null;
  singularLabel: string;
  initialMode: DeleteModalMode;
  deleting: boolean;
  forceDeleting: boolean;
  onCancel: () => void;
  onStandardDelete: (id: number) => Promise<DeleteEquipmentAttemptResult>;
  onForceDelete: (id: number, reason: string) => Promise<{ error?: string }>;
}

interface ForceEffectItem {
  title: string;
  detail: string;
}

const BLOCKER_DESCRIPTIONS: Record<string, ForceEffectItem> = {
  bench_assignment: {
    title: 'Active bench assignment',
    detail: 'Immediately unassigned from its bench.',
  },
  loan: {
    title: 'Active equipment loan',
    detail: 'Closed as returned with your operator audit reason.',
  },
  license_assignment: {
    title: 'Active license seat(s)',
    detail: 'Released back to their license pools.',
  },
  booking: {
    title: 'Active booking(s) / reservation(s)',
    detail: 'Cancelled with your operator audit reason.',
  },
};

const ALL_FORCE_EFFECTS: ForceEffectItem[] = [
  {
    title: 'Unassign bench or resting placement',
    detail: 'Removes any active bench assignment or room/station placement.',
  },
  {
    title: 'Close active loan & release licenses',
    detail: 'Marks any active loan as returned and returns assigned license seats to their pools.',
  },
  {
    title: 'Cancel bookings, log audit & soft-delete',
    detail: 'Cancels active reservations, records an operator audit entry, and soft-deletes the unit.',
  },
];

const REASON_MIN_LENGTH = 3;
const REASON_MAX_LENGTH = 500;

export const DeleteEquipmentModal: React.FC<DeleteEquipmentModalProps> = ({
  open,
  item,
  singularLabel,
  initialMode,
  deleting,
  forceDeleting,
  onCancel,
  onStandardDelete,
  onForceDelete,
}) => {
  const [mode, setMode] = useState<DeleteModalMode>(initialMode);
  const [forceStep, setForceStep] = useState<1 | 2>(1);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  if (!item) return null;

  const confirmToken = item.sku?.trim() || item.name?.trim() || `#${item.id}`;
  const displayLabel = item.sku || item.name || `${singularLabel} #${item.id}`;
  const trimmedReason = reason.trim();
  const tokenMatched = typedConfirm.trim() === confirmToken;
  const canProceedForce =
    trimmedReason.length >= REASON_MIN_LENGTH &&
    trimmedReason.length <= REASON_MAX_LENGTH &&
    tokenMatched &&
    acknowledged;

  const busy = deleting || forceDeleting;

  const handleStandardConfirm = async () => {
    setErrorMessage(null);
    const result = await onStandardDelete(item.id);
    if (result.blocked && result.blocked.length > 0) {
      setBlockers(result.blocked);
      setForceStep(1);
      setMode('force');
      return;
    }
    if (result.error) {
      setErrorMessage(result.error);
    }
  };

  const handleProceedToFinalStep = () => {
    if (!canProceedForce) return;
    setErrorMessage(null);
    setForceStep(2);
  };

  const handleForceConfirm = async () => {
    if (!canProceedForce) return;
    setErrorMessage(null);
    const result = await onForceDelete(item.id, trimmedReason);
    if (result.error) {
      setErrorMessage(result.error);
    }
  };

  const switchToForce = () => {
    setErrorMessage(null);
    setForceStep(1);
    setMode('force');
  };

  const switchToStandard = () => {
    setErrorMessage(null);
    setBlockers([]);
    setForceStep(1);
    setMode('standard');
  };

  const isForce = mode === 'force';
  const isFinalStep = isForce && forceStep === 2;

  const effectsToShow: ForceEffectItem[] =
    blockers.length > 0
      ? blockers.map((key) => BLOCKER_DESCRIPTIONS[key] ?? { title: key, detail: 'Will be released or cancelled immediately.' })
      : ALL_FORCE_EFFECTS;

  const headerTitle = isFinalStep
    ? 'Confirm force delete'
    : isForce
      ? `Force delete ${singularLabel.toLowerCase()}`
      : `Delete ${singularLabel.toLowerCase()}`;

  const headerSubtitle = isFinalStep
    ? `Final operator verification for ${displayLabel}`
    : isForce
      ? blockers.length > 0
        ? `Standard delete blocked — active lab records are linked to ${displayLabel}`
        : `Lab operator override with automatic release & audit logging`
      : `Remove ${displayLabel} from active inventory`;

  return (
    <Modal
      open={open}
      onCancel={busy ? undefined : onCancel}
      maskClosable={!busy}
      closable={!busy}
      destroyOnHidden
      width={isForce ? 580 : 480}
      title={
        <div className={styles.modalHeader}>
          <div className={`${styles.headerIcon} ${isForce ? styles.headerIconDanger : styles.headerIconWarning}`}>
            {isForce ? <ShieldAlert /> : <Trash2 />}
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
            {!isForce ? (
              <Button
                type="link"
                danger
                size="small"
                style={{ paddingInline: 0 }}
                disabled={busy}
                onClick={switchToForce}
              >
                Need to force delete?
              </Button>
            ) : isFinalStep ? (
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
            ) : blockers.length === 0 ? (
              <Button
                type="text"
                size="small"
                icon={<ArrowLeft size={14} />}
                disabled={busy}
                onClick={switchToStandard}
              >
                Standard delete
              </Button>
            ) : null}
          </div>

          <Space size={8}>
            <Button onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            {!isForce ? (
              <Button type="primary" danger loading={deleting} onClick={() => void handleStandardConfirm()}>
                Delete {singularLabel}
              </Button>
            ) : !isFinalStep ? (
              <Button
                type="primary"
                danger
                disabled={!canProceedForce || busy}
                onClick={handleProceedToFinalStep}
              >
                Review &amp; confirm
              </Button>
            ) : (
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
              className={`${styles.stepItem} ${isFinalStep ? styles.stepDone : styles.stepActive}`}
            >
              <span className={styles.stepBadge}>
                {isFinalStep ? <Check /> : '1'}
              </span>
              <span>Impact &amp; audit details</span>
            </div>
            <div
              role="listitem"
              className={`${styles.stepItem} ${isFinalStep ? styles.stepActive : ''}`}
            >
              <span className={styles.stepBadge}>2</span>
              <span>Final confirmation</span>
            </div>
          </div>
        )}

        <div className={styles.identityCard}>
          <div className={styles.identityLeft}>
            <span className={styles.identityEyebrow}>
              <Cpu size={13} />
              <span>{singularLabel}</span>
            </span>
            <span className={styles.identityName}>{item.name || item.sku || `${singularLabel} #${item.id}`}</span>
          </div>
          <div className={styles.identityMeta}>
            {item.sku && <span className={styles.skuPill}>{item.sku}</span>}
            <span className={styles.idPill}>#{item.id}</span>
          </div>
        </div>

        {!isForce ? (
          <p className={styles.hintCopy}>
            This removes the {singularLabel.toLowerCase()} from active inventory and cannot be undone from the UI.
            If it still has an active bench assignment, loan, license seat, or booking, standard delete will be
            blocked and you can choose to force-delete it instead.
          </p>
        ) : !isFinalStep ? (
          <>
            <div className={styles.impactCard}>
              <div className={styles.impactHeader}>
                <AlertTriangle />
                <span>
                  {blockers.length > 0
                    ? `Active records that will be released or cancelled on ${displayLabel}`
                    : `Immediate side effects of force-deleting ${displayLabel}`}
                </span>
              </div>
              <ul className={styles.impactList}>
                {effectsToShow.map((effect) => (
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

            <div className={`${styles.fieldGroup} ${styles.reasonGroup}`}>
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
                placeholder="e.g., Scrapped hardware unit, lost in transit, or duplicate inventory entry"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={busy}
                className={styles.reasonTextArea}
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.confirmGroup}`}>
              <div className={styles.fieldLabelRow}>
                <span className={styles.fieldLabel}>
                  <span>Type</span>
                  <span className={styles.tokenChip}>{confirmToken}</span>
                  <span>to confirm</span>
                  <span className={styles.requiredMark}>*</span>
                </span>
                {tokenMatched && (
                  <span className={styles.matchBadge} role="status">
                    <Check size={12} /> Matched
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

            <label className={`${styles.ackCard} ${acknowledged ? styles.ackCardChecked : ''}`}>
              <Checkbox
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                disabled={busy}
              />
              <span className={styles.ackCopy}>
                I confirm as a lab operator that I want to force-delete <strong>{displayLabel}</strong> and
                immediately release or cancel all linked records.
              </span>
            </label>
          </>
        ) : (
          <>
            <div className={styles.dangerBanner} role="status">
              <ShieldAlert />
              <div>
                <div className={styles.dangerBannerTitle}>Permanent operator override</div>
                <div className={styles.dangerBannerCopy}>
                  This immediately removes <strong>{displayLabel}</strong> from active inventory, releases all
                  active placements, loans, and license seats, and cancels reserving bookings. This cannot be
                  undone from the UI.
                </div>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Target {singularLabel.toLowerCase()}</span>
                <span className={styles.reviewValue}>
                  <span className={styles.skuPill}>{confirmToken}</span>{' '}
                  {item.name && item.name !== confirmToken ? item.name : null}
                </span>
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

export default DeleteEquipmentModal;
