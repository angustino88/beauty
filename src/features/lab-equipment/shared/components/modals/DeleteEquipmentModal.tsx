import React, { useState } from 'react';
import { Alert, Button, Checkbox, Descriptions, Input, Modal, Space, Tag, Typography } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { EquipmentItem } from '../../../types/equipment';

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

const BLOCKER_DESCRIPTIONS: Record<string, { label: string; effect: string }> = {
  bench_assignment: {
    label: 'Active bench assignment',
    effect: 'Will be unassigned from its bench immediately',
  },
  loan: {
    label: 'Active loan',
    effect: 'Will be closed as returned with your force-delete reason',
  },
  license_assignment: {
    label: 'Active license seat(s)',
    effect: 'Will be released back to their license pools',
  },
  booking: {
    label: 'Active booking(s) / reservation(s)',
    effect: 'Will be cancelled with your force-delete reason',
  },
};

const ALL_FORCE_EFFECTS = [
  'Unassign from any active bench or resting placement',
  'Close any active loan as returned',
  'Release all assigned license seats',
  'Cancel all active bookings and reservations',
  'Soft-delete the equipment and record an operator audit entry',
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

  const confirmToken = (item.sku?.trim() || item.name?.trim() || `#${item.id}`);
  const displayLabel = item.sku || item.name || `${singularLabel} #${item.id}`;
  const trimmedReason = reason.trim();
  const canProceedForce =
    trimmedReason.length >= REASON_MIN_LENGTH &&
    trimmedReason.length <= REASON_MAX_LENGTH &&
    typedConfirm.trim() === confirmToken &&
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

  return (
    <Modal
      open={open}
      onCancel={busy ? undefined : onCancel}
      maskClosable={!busy}
      closable={!busy}
      destroyOnHidden
      width={isForce ? 580 : 480}
      title={
        <Space size={8}>
          {isForce ? (
            <WarningOutlined style={{ color: 'var(--lm-danger-solid, #ff4d4f)' }} />
          ) : (
            <ExclamationCircleOutlined style={{ color: 'var(--lm-warning-solid, #faad14)' }} />
          )}
          <span>
            {isFinalStep
              ? `Final confirmation: Force delete ${displayLabel}`
              : isForce
                ? `Force delete ${displayLabel}`
                : `Delete ${displayLabel}?`}
          </span>
          {isForce && (
            <Tag color={isFinalStep ? 'red' : 'volcano'} style={{ marginInlineStart: 4 }}>
              Step {forceStep} of 2
            </Tag>
          )}
        </Space>
      }
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
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
            ) : blockers.length === 0 ? (
              <Button
                type="link"
                size="small"
                style={{ paddingInline: 0 }}
                disabled={busy}
                onClick={switchToStandard}
              >
                Back to standard delete
              </Button>
            ) : null}
          </div>
          <Space>
            <Button onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            {!isForce ? (
              <Button type="primary" danger loading={deleting} onClick={() => void handleStandardConfirm()}>
                Delete
              </Button>
            ) : !isFinalStep ? (
              <Button
                type="primary"
                danger
                disabled={!canProceedForce || busy}
                onClick={handleProceedToFinalStep}
              >
                Continue to final confirmation
              </Button>
            ) : (
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
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions size="small" column={2} bordered>
          <Descriptions.Item label="SKU">
            <Typography.Text code>{item.sku || '—'}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="ID">#{item.id}</Descriptions.Item>
          <Descriptions.Item label="Name" span={2}>
            {item.name || '—'}
          </Descriptions.Item>
        </Descriptions>

        {!isForce ? (
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            This removes the {singularLabel.toLowerCase()} from active inventory and cannot be undone from the UI.
            If it still has an active bench assignment, loan, license seat, or booking, standard delete will be blocked
            and you can choose to force-delete it instead.
          </Typography.Paragraph>
        ) : !isFinalStep ? (
          <>
            <Alert
              type="error"
              showIcon
              title={
                blockers.length > 0
                  ? 'Standard delete blocked — active lab records are linked to this unit'
                  : 'Destructive lab operator override'
              }
              description={
                blockers.length > 0 ? (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ marginBottom: 6 }}>
                      Force-deleting will immediately release or cancel the following active records:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {blockers.map((key) => {
                        const info = BLOCKER_DESCRIPTIONS[key];
                        return (
                          <li key={key}>
                            <strong>{info?.label ?? key}</strong>
                            {info?.effect ? ` — ${info.effect}` : ''}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ marginBottom: 6 }}>
                      Force-deleting bypasses standard dependency checks and will immediately:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {ALL_FORCE_EFFECTS.map((effect) => (
                        <li key={effect}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                )
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
                placeholder="e.g., Scrapped hardware unit, lost in transit, or duplicate inventory entry"
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
              I confirm as a lab operator that I want to force-delete <strong>{displayLabel}</strong> and
              immediately release or cancel all linked records.
            </Checkbox>
          </>
        ) : (
          <>
            <Alert
              type="error"
              showIcon
              title="Final confirmation required"
              description={
                <div>
                  You are about to permanently force-delete <strong>{displayLabel}</strong>. This action cannot
                  be undone from the UI and will immediately release or cancel every active placement, loan,
                  license seat, and reservation on this unit.
                </div>
              }
            />
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Confirmed identifier">
                <Typography.Text code>{confirmToken}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="Audit reason">{trimmedReason}</Descriptions.Item>
            </Descriptions>
          </>
        )}

        {errorMessage && <Alert type="error" showIcon title={errorMessage} />}
      </Space>
    </Modal>
  );
};

export default DeleteEquipmentModal;
