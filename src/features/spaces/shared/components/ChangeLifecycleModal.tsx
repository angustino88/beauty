import React, { useState } from 'react';
import { Alert, Form, Radio, Select, message } from 'antd';
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
import styles from './ResourceStatusComponents.module.css';

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

interface FormValues {
  lifecycle_status?: LifecycleStatus;
  access_policy?: AccessPolicy;
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
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const [changeRoom, { isLoading: roomLoading }] = useChangeRoomLifecycleMutation();
  const [changeStation, { isLoading: stationLoading }] = useChangeStationLifecycleMutation();
  const [changeBench, { isLoading: benchLoading }] = useChangeBenchLifecycleMutation();

  const isSubmitting = roomLoading || stationLoading || benchLoading;
  const allowedLifecycleMoves = getAllowedLifecycleTransitions(currentLifecycle);

  const handleFinish = async (values: FormValues) => {
    if (values.lifecycle_status === 'retired') {
      setPendingValues(values);
      setShowRetireConfirm(true);
      return;
    }

    await executeChange(values);
  };

  const executeChange = async (values: FormValues) => {
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

      message.success('Lifecycle and access updated successfully');
      setShowRetireConfirm(false);
      setPendingValues(null);
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorObj = (err as { data?: { error?: { message?: string }; message?: string } })?.data;
      const errorMsg =
        errorObj?.error?.message ||
        errorObj?.message ||
        'Failed to update lifecycle status. Please check for active child resources or overlapping schedules.';
      message.error(errorMsg);
      setShowRetireConfirm(false);
    }
  };

  const supportsAccess = resourceType === 'room' || resourceType === 'station';

  return (
    <>
      <FormDialog
        open={open && !showRetireConfirm}
        title={`Change Lifecycle & Access: ${resourceType.toUpperCase()} ${resourceName || `#${resourceId}`}`}
        description="Manage the resource lifecycle and access policy. Downtime is managed separately."
        submitLabel="Save changes"
        busy={isSubmitting}
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
            lifecycle_status: allowedLifecycleMoves[0] ?? currentLifecycle,
            access_policy: currentAccessPolicy,
          }}
          onFinish={handleFinish}
        >
          <div style={{ marginBottom: 16 }}>
            <strong>Current status:</strong>{' '}
            <span>{currentLifecycle ? LIFECYCLE_STATUS_LABELS[currentLifecycle] : '—'}</span>
            {currentAccessPolicy && (
              <span> ({ACCESS_POLICY_LABELS[currentAccessPolicy]})</span>
            )}
          </div>

          <Form.Item
            name="lifecycle_status"
            label="New Lifecycle Status"
            help={
              currentLifecycle === 'retired'
                ? 'This resource is retired. Retiring is final.'
                : 'Allowed moves: planned -> in_service, planned -> retired, in_service -> retired.'
            }
          >
            {currentLifecycle === 'retired' || allowedLifecycleMoves.length === 0 ? (
              <Select disabled value={currentLifecycle}>
                <Select.Option value="retired">Retired (Final)</Select.Option>
              </Select>
            ) : (
              <Radio.Group>
                {allowedLifecycleMoves.map((status) => (
                  <Radio.Button key={status} value={status}>
                    {LIFECYCLE_STATUS_LABELS[status]}
                  </Radio.Button>
                ))}
              </Radio.Group>
            )}
          </Form.Item>

          {supportsAccess && (
            <Form.Item
              name="access_policy"
              label="Access Policy"
              help="Open to everyone or Restricted"
            >
              <Radio.Group>
                <Radio.Button value="open">{ACCESS_POLICY_LABELS.open}</Radio.Button>
                <Radio.Button value="restricted">{ACCESS_POLICY_LABELS.restricted}</Radio.Button>
              </Radio.Group>
            </Form.Item>
          )}

          <div className={styles.warningBox}>
            <strong>Note:</strong> Downtime and Out of Service conditions are managed separately under the <em>Downtime</em> tab and do not modify the stored lifecycle status.
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
        <Alert
          type="error"
          showIcon
          message="Retiring is final and cannot be undone!"
          description="Retiring this resource will end current downtime windows and cancel any planned downtime windows. You will not be able to return this resource to service."
        />
        <p style={{ marginTop: 12 }}>
          Are you sure you want to retire <strong>{resourceType} {resourceName || `#${resourceId}`}</strong>?
        </p>
      </FormDialog>
    </>
  );
};

export default ChangeLifecycleModal;
