import { Form, Modal } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { extractBookingErrorMessage, processBookingBody } from '@/shared/utils/booking';
import { confirmAction, notify } from '@/shared/notifications';
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

export const BenchBookingEdit: React.FC<BenchBookingEditProps> = ({
  visible,
  eventId,
  refetchBooking,
  onClose,
}) => {
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
        notify.error('Unable to load booking', {
          description: extractBookingErrorMessage(error, 'Please close and reopen the dialog to try again.'),
        });
      });
  }, [eventId, fetchBooking, form]);

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
          notify.success('Booking cancelled');
          refetchBooking?.();
          onClose?.();
        } catch (error: unknown) {
          notify.error('Unable to cancel booking', {
            description: extractBookingErrorMessage(error, 'Please try again.'),
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      if (valuesWithStatus.status === 'completed') {
        try {
          await completeBooking(eventId!).unwrap();
          notify.success('Booking marked as completed');
          refetchBooking?.();
          onClose?.();
        } catch (error: unknown) {
          notify.error('Unable to complete booking', {
            description: extractBookingErrorMessage(error, 'Please try again.'),
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      const startsAt = dayjs(values.starts_at as string);
      const endsAt = dayjs(values.ends_at as string);
      const durationInHours = endsAt.diff(startsAt, 'hours', true);
      const requiresApproval = durationInHours > 4 && valuesWithStatus.status !== 'cancel';

      const doUpdate = async () => {
        try {
          const body = processBookingBody(valuesWithStatus as Record<string, unknown>);
          const response = await updateBooking({
            id: eventId!,
            body: body as BenchBookingUpdateRequest,
          }).unwrap();

          const title = requiresApproval
            ? 'Booking update submitted for approval'
            : 'Booking updated';
          notify.success(title, {
            code: response?.booking_code || undefined,
          });
          refetchBooking?.();
          onClose?.();
        } catch (error: unknown) {
          notify.error('Unable to update booking', {
            description: extractBookingErrorMessage(error, 'Please review your changes and try again.'),
          });
        } finally {
          setLoading(false);
        }
      };

      if (requiresApproval) {
        confirmAction({
          title: 'Coordinator approval required',
          description: `This booking spans ${durationInHours.toFixed(1)} hours, which exceeds the 4-hour standard limit. Submit the updated request for coordinator approval?`,
          confirmText: 'Submit for approval',
          cancelText: 'Cancel',
          variant: 'warning',
          onConfirm: async () => {
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
      <BookingForm form={form} formProps={{ onFinish: handleOnFinish }} />
    </Modal>
  );
};

export default BenchBookingEdit;
