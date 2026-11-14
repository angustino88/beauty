import React, { useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Radio,
  Select,
  message,
} from 'antd';
import { ToolOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import {
  CONDITION_LABELS,
  DOWNTIME_REASON_LABELS,
  parseDowntimeBookingConflicts,
  type DowntimeConflictBooking,
  type DowntimeKind,
  type DowntimeReason,
  type ResourceType,
  type ScheduleDowntimeRequest,
} from '../resourceStatus';
import { useCreateDowntimeMutation } from '../downtimeApi';
import styles from './Downtime.module.css';
import { FormDialog } from '@/components/ui/form-dialog';

interface ScheduleDowntimeModalProps {
  open: boolean;
  resourceType: ResourceType;
  resourceId: number;
  resourceName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  condition: 'in_maintenance' | 'out_of_service';
  reason: DowntimeReason;
  kind?: DowntimeKind;
  starts_at?: Dayjs;
  ends_at?: Dayjs;
  notes?: string;
}

interface ApiProblemDetail {
  field?: string | null;
  code?: string;
  message?: string;
}

interface ApiErrorResponse {
  data?: {
    error?: {
      code?: string;
      message?: string;
      details?: ApiProblemDetail[];
    };
    message?: string;
    detail?: string;
  };
  status?: number;
}

export const ScheduleDowntimeModal: React.FC<ScheduleDowntimeModalProps> = ({
  open,
  resourceType,
  resourceId,
  resourceName,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [createDowntime, { isLoading }] = useCreateDowntimeMutation();
  const [conflicts, setConflicts] = useState<DowntimeConflictBooking[] | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string>('');
  const [lastPayload, setLastPayload] = useState<ScheduleDowntimeRequest | null>(null);

  const watchedCondition = Form.useWatch('condition', form) ?? 'in_maintenance';
  const watchedStartsAt = Form.useWatch('starts_at', form);

  const resetState = () => {
    form.resetFields();
    setConflicts(null);
    setConflictMessage('');
    setLastPayload(null);
  };

  const handleCancel = () => {
    resetState();
    onClose();
  };

  const applyDurationPreset = (hours: number | 'eod' | null) => {
    const base = watchedStartsAt || dayjs();
    if (hours === null) {
      form.setFieldValue('ends_at', null);
    } else if (hours === 'eod') {
      form.setFieldValue('ends_at', base.endOf('day'));
    } else {
      form.setFieldValue('ends_at', base.add(hours, 'hour'));
    }
  };

  const handleSubmit = async (values: FormValues) => {
    const startsAtIso = values.starts_at
      ? values.starts_at.toISOString()
      : dayjs().toISOString();
    const endsAtIso = values.ends_at ? values.ends_at.toISOString() : null;

    // Default kind: planned if starts later, else unplanned
    const autoKind: DowntimeKind = values.kind
      ? values.kind
      : values.starts_at && values.starts_at.isAfter(dayjs().add(5, 'minutes'))
        ? 'planned'
        : 'unplanned';

    const payload: ScheduleDowntimeRequest = {
      resource_type: resourceType,
      resource_id: resourceId,
      condition: values.condition,
      reason: values.reason || 'other',
      kind: autoKind,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      notes: values.notes ? values.notes.slice(0, 2000) : undefined,
      cancel_conflicting_bookings: false,
    };

    setLastPayload(payload);

    try {
      await createDowntime(payload).unwrap();
      message.success('Downtime scheduled successfully');
      resetState();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      const errorObj = apiErr.data?.error;
      const errorCode = errorObj?.code;

      if (errorCode === 'downtime_booking_conflict') {
        const parsed = parseDowntimeBookingConflicts(errorObj?.details);
        setConflicts(parsed);
        setConflictMessage(
          errorObj?.message ||
            'Bookings overlap this downtime window. Cancel them or choose another period.',
        );
        return;
      }

      if (errorCode === 'downtime_overlap') {
        message.error(
          errorObj?.message || 'This resource already has downtime in that period.',
        );
        return;
      }

      if (errorCode === 'downtime_not_allowed') {
        message.error(
          errorObj?.message ||
            'The resource is not in service (planned or retired). Downtime cannot be scheduled.',
        );
        return;
      }

      const fallbackMsg =
        errorObj?.message ||
        apiErr.data?.message ||
        apiErr.data?.detail ||
        'Failed to schedule downtime.';
      message.error(fallbackMsg);
    }
  };

  const handleConfirmConflict = async () => {
    if (!lastPayload) return;
    try {
      await createDowntime({
        ...lastPayload,
        cancel_conflicting_bookings: true,
      }).unwrap();
      message.success('Downtime scheduled and conflicting bookings cancelled');
      resetState();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      message.error(
        apiErr.data?.error?.message ||
          apiErr.data?.message ||
          'Failed to schedule downtime after confirming cancellation.',
      );
    }
  };

  return (
    <>
      <FormDialog
        open={open && !conflicts}
        title={`Schedule Downtime: ${resourceType.toUpperCase()} ${resourceName || `#${resourceId}`}`}
        description="Plan maintenance or an out-of-service window. Overlapping bookings require confirmation."
        submitLabel="Schedule downtime"
        busy={isLoading}
        onSubmit={() => form.submit()}
        onCancel={handleCancel}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            condition: 'in_maintenance',
            reason: 'maintenance',
            starts_at: dayjs(),
          }}
          onFinish={handleSubmit}
        >
          {/* Visual Condition Picker Cards */}
          <Form.Item
            name="condition"
            label="Target Condition"
            rules={[{ required: true, message: 'Please select condition' }]}
          >
            <div className={styles.conditionCards}>
              <div
                className={`${styles.conditionCard} ${
                  watchedCondition === 'in_maintenance' ? styles.conditionSelectedMaintenance : ''
                }`}
                onClick={() => form.setFieldValue('condition', 'in_maintenance')}
              >
                <div className={styles.conditionTitle} style={{ color: '#d97706' }}>
                  <ToolOutlined />
                  <span>{CONDITION_LABELS.in_maintenance}</span>
                </div>
                <span className={styles.conditionDesc}>
                  Routine servicing, inspection, firmware update, or calibration.
                </span>
              </div>

              <div
                className={`${styles.conditionCard} ${
                  watchedCondition === 'out_of_service' ? styles.conditionSelectedOutOfService : ''
                }`}
                onClick={() => form.setFieldValue('condition', 'out_of_service')}
              >
                <div className={styles.conditionTitle} style={{ color: '#dc2626' }}>
                  <ExclamationCircleOutlined />
                  <span>{CONDITION_LABELS.out_of_service}</span>
                </div>
                <span className={styles.conditionDesc}>
                  Hardware failure, physical hazard, breakdown, or shutdown.
                </span>
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <Select placeholder="Select primary reason">
              {(Object.keys(DOWNTIME_REASON_LABELS) as DowntimeReason[]).map((r) => (
                <Select.Option key={r} value={r}>
                  {DOWNTIME_REASON_LABELS[r]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="kind" label="Kind (Schedule Classification)">
            <Radio.Group>
              <Radio value={undefined}>Auto (based on start time)</Radio>
              <Radio value="planned">Planned Maintenance</Radio>
              <Radio value="unplanned">Unplanned Incident</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="starts_at"
            label="Starts At"
            rules={[{ required: true, message: 'Start time is required' }]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="ends_at"
            label="Ends At (Estimated End / Duration)"
            tooltip="Leave blank for open-ended outage until manually resolved"
          >
            <div className={styles.presetRow}>
              <span style={{ fontSize: 11, color: '#64748b', marginRight: 4 }}>Quick presets:</span>
              <Button size="small" className={styles.presetBtn} onClick={() => applyDurationPreset(1)}>
                +1 Hour
              </Button>
              <Button size="small" className={styles.presetBtn} onClick={() => applyDurationPreset(4)}>
                +4 Hours
              </Button>
              <Button size="small" className={styles.presetBtn} onClick={() => applyDurationPreset('eod')}>
                End of Day
              </Button>
              <Button size="small" className={styles.presetBtn} onClick={() => applyDurationPreset(24)}>
                24 Hours
              </Button>
              <Button size="small" className={styles.presetBtn} onClick={() => applyDurationPreset(48)}>
                48 Hours
              </Button>
              <Button size="small" className={styles.presetBtn} onClick={() => applyDurationPreset(null)}>
                Open-ended
              </Button>
            </div>
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              disabledDate={(current) =>
                watchedStartsAt ? current && current.isBefore(watchedStartsAt, 'day') : false
              }
            />
          </Form.Item>

          <Form.Item name="notes" label="Technician Notes / Context">
            <Input.TextArea
              rows={3}
              maxLength={2000}
              showCount
              placeholder="Provide reason details, work ticket numbers, or technician notes..."
            />
          </Form.Item>
        </Form>
      </FormDialog>

      {/* Conflict Confirmation Dialog */}
      <FormDialog
        open={Boolean(conflicts)}
        title="Downtime Booking Conflict"
        description="Review the affected bookings before confirming cancellation."
        submitLabel="Cancel bookings & schedule"
        destructive busy={isLoading}
        cancelLabel="Choose another period"
        onSubmit={handleConfirmConflict}
        onCancel={() => {
          setConflicts(null);
          setConflictMessage('');
        }}
      >
        <Alert
          type="warning"
          showIcon
          message="Overlapping Bookings Detected"
          description={conflictMessage}
        />
        <div style={{ marginTop: 12 }}>
          <strong>The following bookings will be cancelled:</strong>
          <ul className={styles.conflictList}>
            {conflicts?.map((c) => (
              <li key={`${c.kind}-${c.id}`} className={styles.conflictItem}>
                <span className={styles.conflictBookingLink}>#{c.id}: </span>
                {c.message}
              </li>
            ))}
          </ul>
        </div>
      </FormDialog>
    </>
  );
};

export default ScheduleDowntimeModal;
