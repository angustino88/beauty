import { Form, message, Modal } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { processBookingBody } from '@/shared/utils/booking';
import type { IBenchBookingFormValues } from '../types';
import type { BenchBookingUpdateRequest } from '../mapper';
import { BookingForm } from './BookingForm';
import {
  useCancelBenchBookingMutation,
  useCompleteBenchBookingMutation,
  useLazyGetBenchBookingByIdQuery,
  useUpdateBenchBookingMutation,
} from '../api';
import styles from './BookingModal.module.css';

export interface BenchBookingEditProps {
  visible?: boolean;
  eventId?: string | number;
  onClose?: () => void;
  refetchBooking?: () => void;
}

function getBookingErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const data = 'data' in error ? error.data : undefined;
  if (!data || typeof data !== 'object') return fallback;

  const payload = data as Record<string, unknown>;
  for (const key of ['message', 'detail', 'title']) {
    if (typeof payload[key] === 'string' && payload[key].trim()) {
      return payload[key] as string;
    }
  }

  const nestedError = payload.error;
  if (typeof nestedError === 'string' && nestedError.trim()) return nestedError;
  if (nestedError && typeof nestedError === 'object') {
    const nestedMessage = (nestedError as Record<string, unknown>).message;
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
  }

  return fallback;
}

export const BenchBookingEdit: React.FC<BenchBookingEditProps> = ({
  visible,
  eventId,
  refetchBooking,
  onClose,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<IBenchBookingFormValues>();
  const [loading, setLoading] = useState(false);

  const [fetchBooking, { isFetching: isFetchingBooking }] = useLazyGetBenchBookingByIdQuery();
  const [updateBooking] = useUpdateBenchBookingMutation();
  const [cancelBooking] = useCancelBenchBookingMutation();
  const [completeBooking] = useCompleteBenchBookingMutation();

  useEffect(() => {
    if (!eventId) return;
    fetchBooking(eventId)
      .unwrap()
      .then((data) => {
        const start = dayjs(data.starts_at);
        const end = dayjs(data.ends_at);
        const benchId = data.bench?.id ?? null;
        const projectId = data.project?.id ?? null;
        const reason = data.reason || undefined;

        form.setFieldsValue({
          starts_at: start,
          ends_at: end,
          status: data.status,
          reason,
          project_id: projectId,
          bench_id: benchId,
        });
      })
      .catch((error: unknown) => {
        void messageApi.error(getBookingErrorMessage(error, 'Failed to load booking'));
      });
  }, [eventId, fetchBooking, form, messageApi]);

  const handleOk = async () => {
    try {
      setLoading(true);
      await form.validateFields();
      form.submit();
    } catch {
      setLoading(false);
    }
  };

  const handleOnFinish = async (values: IBenchBookingFormValues) => {
    try {
      const valuesWithStatus = {
        ...values,
        status: typeof values.status === 'string' ? values.status.toLowerCase() : values.status,
      };

      if (valuesWithStatus.status === 'cancelled' || valuesWithStatus.status === 'cancel') {
        try {
          await cancelBooking({
            id: eventId!,
            reason: values.reason || 'Cancelled by user',
          }).unwrap();
          void message.success('Booking cancelled successfully');
          refetchBooking?.();
          onClose?.();
        } catch (error: unknown) {
          void messageApi.error(getBookingErrorMessage(error, 'Failed to cancel booking'));
        } finally {
          setLoading(false);
        }
        return;
      }

      if (valuesWithStatus.status === 'completed') {
        try {
          await completeBooking(eventId!).unwrap();
          void message.success('Booking completed successfully');
          refetchBooking?.();
          onClose?.();
        } catch (error: unknown) {
          void messageApi.error(getBookingErrorMessage(error, 'Failed to complete booking'));
        } finally {
          setLoading(false);
        }
        return;
      }

      const startsAt = dayjs(values.starts_at as string);
      const endsAt = dayjs(values.ends_at as string);
      const durationInHours = endsAt.diff(startsAt, 'hours', true);

      const doUpdate = async () => {
        try {
          const body = processBookingBody(valuesWithStatus as Record<string, unknown>);
          const response = await updateBooking({
            id: eventId!,
            body: body as BenchBookingUpdateRequest,
          }).unwrap();

          if (!response?.booking_code) {
            void message.success('Booking updated successfully');
          } else {
            void message.success({
              content: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  <code
                    style={{
                      padding: '2px 7px',
                      border: '1px solid var(--lm-success-solid)',
                      borderRadius: 4,
                      background: 'var(--lm-surface-muted)',
                      color: 'var(--lm-success-fg)',
                      fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {response.booking_code}
                  </code>
                  <strong style={{ fontSize: 13 }}>updated</strong>
                </span>
              ),
              duration: 4,
            });
          }
          refetchBooking?.();
          onClose?.();
        } catch (error: unknown) {
          void messageApi.error(getBookingErrorMessage(error, 'Failed to edit booking'));
        } finally {
          setLoading(false);
        }
      };

      if (durationInHours > 4 && valuesWithStatus.status !== 'cancel') {
        Modal.confirm({
          title: 'Approval Required',
          content: `This booking spans ${durationInHours.toFixed(1)} hours, exceeding the 4-hour limit. Do you want to submit this request for coordinator approval?`,
          okText: 'Submit',
          cancelText: 'Cancel',
          onOk: async () => {
            await doUpdate();
          },
          onCancel: () => {
            setLoading(false);
          },
        });
      } else {
        await doUpdate();
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <Modal
      className={styles.bookingModal}
      title="Update Booking"
      open={visible}
      onCancel={onClose}
      destroyOnHidden
      zIndex={1050}
      width={640}
      onOk={handleOk}
      confirmLoading={loading || isFetchingBooking}
      okText="Save"
      modalRender={(node) => <div onClick={(e) => e.stopPropagation()}>{node}</div>}
      style={{ top: '10%' }}
    >
      {contextHolder}
      <BookingForm form={form} formProps={{ onFinish: handleOnFinish }} />
    </Modal>
  );
};

export default BenchBookingEdit;
