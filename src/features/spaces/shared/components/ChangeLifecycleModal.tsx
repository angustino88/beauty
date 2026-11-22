import React, { useState, type ReactNode } from 'react';
import { Form } from 'antd';
import { InlineAlert, getApiErrorMessage, notify } from '@/shared/notifications';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  LockOutlined,
  StopOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import { FormDialog } from '@/components/ui/form-dialog';
import {
  ACCESS_POLICY_LABELS,
  getAllowedLifecycleTransitions,
  LIFECYCLE_STATUS_LABELS,
  type AccessPolicy,
  type LifecycleStatus,
  type ResourceType,
} from '../resourceStatus';
import { useChangeRoomLifecycleMutation } from '../../room/api';
import { useChangeStationLifecycleMutation } from '../../station/api';
import { useChangeBenchLifecycleMutation } from '../../bench/api';
import styles from './ChangeLifecycleModal.module.css';

interface ChangeLifecycleModalProps {
  open: boolean;
  resourceType: ResourceType;
  resourceId: number;
  resourceName?: string;
  currentLifecycle?: LifecycleStatus;
  currentAccessPolicy?: AccessPolicy;
  onClose: () => void;
  onSuccess?: () => void;
}

const KEEP = 'keep' as const;
type LifecycleChoice = LifecycleStatus | typeof KEEP;

interface FormValues {
  lifecycle_status?: LifecycleChoice;
  access_policy?: AccessPolicy;
}

interface SubmitValues {
  lifecycle_status?: LifecycleStatus;
  access_policy?: AccessPolicy;
}

const LIFECYCLE_META: Record<LifecycleStatus, { icon: ReactNode; hint: string; tone: 'info' | 'success' | 'danger' }> = {
  planned: { icon: <ClockCircleOutlined />, hint: 'Being prepared. Not bookable yet.', tone: 'info' },
  in_service: { icon: <CheckCircleOutlined />, hint: 'Available for bookings and daily use.', tone: 'success' },
  retired: { icon: <StopOutlined />, hint: 'Permanently out of use. This cannot be undone.', tone: 'danger' },
};

const ACCESS_META: Record<AccessPolicy, { icon: ReactNode; hint: string }> = {
  open: { icon: <UnlockOutlined />, hint: 'Everyone in the lab can book it.' },
  restricted: { icon: <LockOutlined />, hint: 'Only people granted access can book it.' },
};

function OptionCard({ selected, tone, icon, title, hint, onSelect }: {
  selected: boolean;
  tone?: 'info' | 'success' | 'danger' | 'neutral';
  icon: ReactNode;
  title: ReactNode;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`${styles.option} ${selected ? styles.optionSelected : ''} ${tone === 'danger' ? styles.optionDanger : ''}`}
      onClick={onSelect}
    >
      <span className={`${styles.optionIcon} ${styles[`tone_${tone ?? 'neutral'}`]}`}>{icon}</span>
      <span className={styles.optionText}>
        <span className={styles.optionTitle}>{title}</span>
        <span className={styles.optionHint}>{hint}</span>
      </span>
      <span className={styles.optionRadio} aria-hidden="true" />
    </button>
  );
}

export const ChangeLifecycleModal: React.FC<ChangeLifecycleModalProps> = ({
  open,
  resourceType,
  resourceId,
  resourceName,
  currentLifecycle,
  currentAccessPolicy,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<SubmitValues | null>(null);

  const [changeRoom, { isLoading: roomLoading }] = useChangeRoomLifecycleMutation();
  const [changeStation, { isLoading: stationLoading }] = useChangeStationLifecycleMutation();
  const [changeBench, { isLoading: benchLoading }] = useChangeBenchLifecycleMutation();

  const isSubmitting = roomLoading || stationLoading || benchLoading;
  const allowedLifecycleMoves = getAllowedLifecycleTransitions(currentLifecycle);

  const supportsAccess = resourceType === 'room' || resourceType === 'station';
  const lifecycleChoice = (Form.useWatch('lifecycle_status', form) ?? KEEP) as LifecycleChoice;
  const accessChoice = Form.useWatch('access_policy', form) as AccessPolicy | undefined;
  const dirty = lifecycleChoice !== KEEP || (supportsAccess && accessChoice !== currentAccessPolicy);

  const handleFinish = async (formValues: FormValues) => {
    const values: SubmitValues = {
      lifecycle_status: formValues.lifecycle_status === KEEP ? undefined : formValues.lifecycle_status,
      access_policy: supportsAccess ? formValues.access_policy : undefined,
    };
    if (values.lifecycle_status === 'retired') {
      setPendingValues(values);
      setShowRetireConfirm(true);
      return;
    }

    await executeChange(values);
  };

  const executeChange = async (values: SubmitValues) => {
    try {
      if (resourceType === 'room') {
        await changeRoom({
          roomId: resourceId,
          body: {
            lifecycle_status: values.lifecycle_status,
            access_policy: values.access_policy,
          },
        }).unwrap();
      } else if (resourceType === 'station') {
        await changeStation({
          stationId: resourceId,
          body: {
            lifecycle_status: values.lifecycle_status,
            access_policy: values.access_policy,
          },
        }).unwrap();
      } else if (resourceType === 'bench') {
        if (!values.lifecycle_status) return;
        await changeBench({
          benchId: resourceId,
          body: {
            lifecycle_status: values.lifecycle_status as 'in_service' | 'retired',
          },
        }).unwrap();
      }

      notify.success('Lifecycle and access updated');
      setShowRetireConfirm(false);
      setPendingValues(null);
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      notify.error('Unable to update lifecycle status', {
        description: getApiErrorMessage(
          err,
          'Check for active child resources or overlapping schedules and try again.',
        ),
      });
      setShowRetireConfirm(false);
    }
  };

  const isRetired = currentLifecycle === 'retired';
  const currentLabel = currentLifecycle ? LIFECYCLE_STATUS_LABELS[currentLifecycle] : 'Unknown';

  return (
    <>
      <FormDialog
        open={open && !showRetireConfirm}
        title={`Change lifecycle & access · ${resourceName || `${resourceType} #${resourceId}`}`}
        description="Manage the resource lifecycle and access policy. Downtime is managed separately."
        submitLabel="Save changes"
        busy={isSubmitting}
        submitDisabled={!dirty}
        onSubmit={() => form.submit()}
        onCancel={() => {
          form.resetFields();
          onClose();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            lifecycle_status: KEEP,
            access_policy: currentAccessPolicy,
          }}
          onFinish={handleFinish}
        >
          <div className={styles.current}>
            <span className={styles.currentLabel}>Current</span>
            <span className={`${styles.pill} ${styles[`pill_${currentLifecycle ? LIFECYCLE_META[currentLifecycle].tone : 'info'}`]}`}>
              {currentLifecycle && LIFECYCLE_META[currentLifecycle].icon}
              {currentLabel}
            </span>
            {supportsAccess && currentAccessPolicy && (
              <span className={styles.pill}>
                {ACCESS_META[currentAccessPolicy].icon}
                {ACCESS_POLICY_LABELS[currentAccessPolicy]} access
              </span>
            )}
          </div>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>Lifecycle</h4>
            {isRetired || allowedLifecycleMoves.length === 0 ? (
              <div className={styles.locked}>
                <StopOutlined /> This resource is retired. Retiring is final, so its lifecycle can no longer change.
              </div>
            ) : (
              <Form.Item name="lifecycle_status" noStyle>
                <div role="radiogroup" aria-label="Lifecycle" className={styles.options}>
                  <OptionCard
                    selected={lifecycleChoice === KEEP}
                    tone="neutral"
                    icon={currentLifecycle ? LIFECYCLE_META[currentLifecycle].icon : <CheckCircleOutlined />}
                    title={`Keep as ${currentLabel.toLowerCase()}`}
                    hint="No lifecycle change."
                    onSelect={() => form.setFieldValue('lifecycle_status', KEEP)}
                  />
                  {allowedLifecycleMoves.map((status) => (
                    <OptionCard
                      key={status}
                      selected={lifecycleChoice === status}
                      tone={LIFECYCLE_META[status].tone}
                      icon={LIFECYCLE_META[status].icon}
                      title={`Move to ${LIFECYCLE_STATUS_LABELS[status].toLowerCase()}`}
                      hint={LIFECYCLE_META[status].hint}
                      onSelect={() => form.setFieldValue('lifecycle_status', status)}
                    />
                  ))}
                </div>
              </Form.Item>
            )}
          </section>

          {supportsAccess && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>Access policy</h4>
              <Form.Item name="access_policy" noStyle>
                <div role="radiogroup" aria-label="Access policy" className={`${styles.options} ${styles.optionsTwo}`}>
                  {(['open', 'restricted'] as AccessPolicy[]).map((policy) => (
                    <OptionCard
                      key={policy}
                      selected={accessChoice === policy}
                      icon={ACCESS_META[policy].icon}
                      title={ACCESS_POLICY_LABELS[policy]}
                      hint={ACCESS_META[policy].hint}
                      onSelect={() => form.setFieldValue('access_policy', policy)}
                    />
                  ))}
                </div>
              </Form.Item>
            </section>
          )}

          <div className={styles.note}>
            <InfoCircleOutlined className={styles.noteIcon} />
            <span>
              Maintenance and out-of-service periods are handled in the <strong>Downtime</strong> tab and don't change the lifecycle.
            </span>
          </div>
        </Form>
      </FormDialog>

      {/* Confirmation when retiring */}
      <FormDialog
        open={showRetireConfirm}
        title="Confirm Resource Retirement"
        description="This is a permanent change. Please review before continuing."
        submitLabel="Retire resource"
        destructive busy={isSubmitting}
        onSubmit={() => { if (pendingValues) void executeChange(pendingValues); }}
        onCancel={() => setShowRetireConfirm(false)}
      >
        <InlineAlert
          variant="error"
          title="Retiring this resource is permanent"
          description="Active downtime windows will end and planned windows will be cancelled. Retired resources cannot be returned to service."
        />
        <p style={{ marginTop: 12 }}>
          Are you sure you want to retire <strong>{resourceType} {resourceName || `#${resourceId}`}</strong>?
        </p>
      </FormDialog>
    </>
  );
};

export default ChangeLifecycleModal;
