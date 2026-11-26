import { CalendarOutlined } from '@ant-design/icons';
import { Form, Modal, type ModalProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  extractBookingErrorMessage,
  processBookingBody,
  roundUpToNearest5Minutes,
} from '@/shared/utils/booking';
import { confirmAction, notify } from '@/shared/notifications';
import type { IBenchBookingFormValues } from '../types';
import type { BenchBookingCreateRequest } from '../mapper';
import { BookingForm } from './BookingForm';
import { useSlotAlert } from '../slot-alerts/useSlotAlert';
import { useCreateBenchBookingMutation, useGetBookingBenchChoicesQuery } from '../api';
import styles from './BookingModal.module.css';

export type CustomModalProps = {
  modalProps?: ModalProps;
  closeModal?: (selectedBench: number) => void;
  timeInterval?: {
    starts_at?: Dayjs;
    ends_at?: Dayjs;
  };
  refetchBooking?: () => void;
};

export const BenchBookingCreate: React.FC<CustomModalProps> = ({
  modalProps,
  closeModal,
  timeInterval,
  refetchBooking,
}) => {
  const [formInstance] = Form.useForm<IBenchBookingFormValues>();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { createAlert } = useSlotAlert();

  // Same query (and cache entry) as the form's bench select.
  const { data: benchChoices } = useGetBookingBenchChoicesQuery({ includeId: null, hasComputing: true });
  const [createBooking] = useCreateBenchBookingMutation();

  useEffect(() => {
    const now = dayjs();
    const from = timeInterval?.starts_at;
    const to = timeInterval?.ends_at;
    const resolvedFrom = from && from.isAfter(now) ? from : now;
    const resolvedTo = to && to.isAfter(now) ? to : roundUpToNearest5Minutes(now.add(30, 'minutes'));

    formInstance.setFieldsValue({
      starts_at: resolvedFrom,
      ends_at: resolvedTo,
    });
  }, [formInstance, timeInterval]);

  useEffect(() => {
    const rawIds = searchParams.get('bench_ids');
    const res = rawIds?.split(',') || [];
    const targetId = parseInt(res[0], 10);
    if (!Number.isNaN(targetId) && benchChoices?.some((bench) => bench.id === targetId)) {
      formInstance.setFieldValue('bench_id', targetId);
    }
  }, [benchChoices, searchParams, formInstance]);

  const handleOnFinish = async (values: IBenchBookingFormValues) => {
    try {
      const startsAt = dayjs(values.starts_at as string | Dayjs);
      const endsAt = dayjs(values.ends_at as string | Dayjs);
      const durationInHours = endsAt.startOf('minute').diff(startsAt.startOf('minute'), 'hours', true);
      const requiresApproval = durationInHours > 4;

      const doCreate = async () => {
        try {
          const body = processBookingBody(values as Record<string, unknown>);
          const response = await createBooking(body as BenchBookingCreateRequest).unwrap();
          const successTitle = requiresApproval
            ? 'Booking submitted for approval'
            : 'Booking created';

          if (!response.booking_code) {
            notify.success(successTitle);
          } else {
            let copied = false;
            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(response.booking_code);
                copied = true;
              }
            } catch {
              copied = false;
            }

            notify.success(successTitle, {
              code: response.booking_code,
              description: copied
                ? 'Booking code copied to clipboard.'
                : 'Save this booking code for your session.',
              duration: 5000,
            });
          }
          closeModal?.(response.bench?.id ?? 0);
          refetchBooking?.();
        } catch (error: unknown) {
          const description = extractBookingErrorMessage(error, 'Please review your booking details and try again.');
          if ((error as { status?: number })?.status === 409 && values.bench_id) {
            // The bench is taken for that time: offer an alert for when it frees up.
            confirmAction({
              title: 'This time is already booked',
              description: `${description} We can notify you if this time becomes free.`,
              confirmText: 'Notify me',
              cancelText: 'Not now',
              onConfirm: async () => {
                if (values.bench_id && (await createAlert({ benchId: values.bench_id, startsAt, endsAt }))) {
                  closeModal?.(values.bench_id);
                }
              },
            });
          } else {
            notify.error('Unable to create booking', { description });
          }
        }
      };

      if (requiresApproval) {
        confirmAction({
          title: 'Coordinator approval required',
          description: `This booking spans ${durationInHours.toFixed(1)} hours, which exceeds the 4-hour standard limit. Submit it for coordinator approval?`,
          confirmText: 'Submit for approval',
          cancelText: 'Cancel',
          variant: 'warning',
          onConfirm: async () => {
            await doCreate();
          },
        });
      } else {
        await doCreate();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOk = async () => {
    try {
      setLoading(true);
      await formInstance.validateFields();
      formInstance.submit();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal
      {...modalProps}
      className={styles.bookingModal}
      title={
        <div className={styles.modalTitle}>
          <CalendarOutlined />
          <div>Create Booking</div>
        </div>
      }
      destroyOnHidden={true}
      mask={{ closable: true }}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Create Booking"
      cancelText="Cancel"
      width={640}
      style={{ top: 24 }}
    >
      <BookingForm form={formInstance} formProps={{ onFinish: handleOnFinish }} />
    </Modal>
  );
};

export default BenchBookingCreate;
