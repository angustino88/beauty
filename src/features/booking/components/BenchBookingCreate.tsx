import { CalendarOutlined } from '@ant-design/icons';
import { Form, message, Modal, type ModalProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  extractBookingErrorMessage,
  processBookingBody,
  roundUpToNearest5Minutes,
} from '@/shared/utils/booking';
import type { IBenchBookingFormValues } from '../types';
import type { BenchBookingCreateRequest } from '../mapper';
import { BookingForm } from './BookingForm';
import { useCreateBenchBookingMutation, useGetBenchOptionsQuery } from '../api';
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
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const { data: benchOptions } = useGetBenchOptionsQuery();
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
    if (!Number.isNaN(targetId) && benchOptions) {
      const preselected = benchOptions.find((b) => b.value === targetId);
      if (preselected) {
        formInstance.setFieldValue('bench_id', preselected.value);
      }
    }
  }, [benchOptions, searchParams, formInstance]);

  const handleOnFinish = async (values: IBenchBookingFormValues) => {
    try {
      const startsAt = dayjs(values.starts_at as string | Dayjs);
      const endsAt = dayjs(values.ends_at as string | Dayjs);
      const durationInHours = endsAt.startOf('minute').diff(startsAt.startOf('minute'), 'hours', true);

      const doCreate = async () => {
        try {
          const body = processBookingBody(values as Record<string, unknown>);
          const response = await createBooking(body as BenchBookingCreateRequest).unwrap();
          if (!response.booking_code) {
            void message.success('Booking created successfully');
          } else {
            void message.success({
              content: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  <code
                    style={{
                      padding: '2px 7px',
                      border: '1px solid #9ccdb4',
                      borderRadius: 4,
                      background: '#e8f3ed',
                      color: '#006b3f',
                      fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {response.booking_code}
                  </code>
                  <span>Booking created successfully!</span>
                </span>
              ),
              duration: 4,
            });

            try {
              if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
              await navigator.clipboard.writeText(response.booking_code);
              void message.success('Booking code copied to clipboard!');
            } catch {
              void message.info(`Booking code: ${response.booking_code}`);
            }
          }
          closeModal?.(response.bench?.id ?? 0);
          refetchBooking?.();
        } catch (error: unknown) {
          void messageApi.error(extractBookingErrorMessage(error, 'Failed to create booking'));
        }
      };

      if (durationInHours > 4) {
        Modal.confirm({
          title: 'Approval Required',
          content: `This booking spans ${durationInHours.toFixed(1)} hours, exceeding the 4-hour limit. Do you want to submit this request for coordinator approval?`,
          okText: 'Submit',
          cancelText: 'Cancel',
          onOk: async () => {
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
      {contextHolder}
      <BookingForm form={formInstance} formProps={{ onFinish: handleOnFinish }} />
    </Modal>
  );
};

export default BenchBookingCreate;
