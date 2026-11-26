import { BellOutlined } from '@ant-design/icons';
import { Alert, Checkbox, DatePicker, Form, Modal, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { filterResourceOption } from '@/components/inputs/ResourceOption';
import { notify } from '@/shared/notifications';
import { DATETIMEFORMAT, extractBookingErrorMessage } from '@/shared/utils/booking';
import { useGetBookingBenchChoicesQuery } from '../api';
import { SLOT_WATCH_CHANNELS, type SlotWatchChannel, useCreateSlotWatchMutation } from '../slotWatchApi';
import { toBenchChoiceOption } from '../utils/benchChoiceOption';
import styles from './BookingModal.module.css';

type SlotWatchFormValues = {
  bench_id: number;
  range: [Dayjs, Dayjs];
  channels: SlotWatchChannel[];
};

export type SlotWatchModalProps = {
  open: boolean;
  onClose: () => void;
  /** Prefill from a booking attempt that hit a conflict. */
  initial?: { benchId?: number; startsAt?: Dayjs; endsAt?: Dayjs };
};

const MAX_RANGE_DAYS = 7;

export const SlotWatchModal: React.FC<SlotWatchModalProps> = ({ open, onClose, initial }) => {
  const [form] = Form.useForm<SlotWatchFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const { data: benchChoices } = useGetBookingBenchChoicesQuery({ includeId: null, hasComputing: true });
  const benchOptions = useMemo(() => (benchChoices ?? []).map((bench) => toBenchChoiceOption(bench)), [benchChoices]);
  const [createSlotWatch] = useCreateSlotWatchMutation();

  useEffect(() => {
    if (!open) return;
    const start = initial?.startsAt ?? dayjs().add(1, 'hour').startOf('hour');
    form.setFieldsValue({
      bench_id: initial?.benchId,
      range: [start, initial?.endsAt ?? start.add(2, 'hour')],
      channels: SLOT_WATCH_CHANNELS.map((channel) => channel.value),
    });
  }, [open, initial, form]);

  const handleFinish = async (values: SlotWatchFormValues) => {
    setSubmitting(true);
    try {
      const [start, end] = values.range;
      const watch = await createSlotWatch({
        bench_id: values.bench_id,
        starts_at: start.second(0).millisecond(0).format(),
        ends_at: end.second(0).millisecond(0).format(),
        channels: values.channels,
      }).unwrap();
      notify.success('Slot alert on', {
        description: `We'll tell you when ${watch.benchName} frees up between ${dayjs(watch.startsAt).format(
          DATETIMEFORMAT,
        )} and ${dayjs(watch.endsAt).format(DATETIMEFORMAT)}.`,
        duration: 5000,
      });
      onClose();
    } catch (error) {
      notify.error('Unable to set slot alert', {
        description: extractBookingErrorMessage(error, 'Please review the bench and time range and try again.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="Notify me"
      cancelText="Cancel"
      className={styles.bookingModal}
      destroyOnHidden
      width={560}
      title={
        <div className={styles.modalTitle}>
          <BellOutlined />
          <div>Notify me when a slot is free</div>
        </div>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="We notify you when the booking blocking your time is ending soon, or when it is cancelled or completed early. The slot is not held: book it quickly to secure it."
      />
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item label="Bench" name="bench_id" rules={[{ required: true, message: 'Please select a bench' }]}>
          <Select
            showSearch
            placeholder="Search by bench SKU or computing name"
            options={benchOptions}
            optionLabelProp="selectedLabel"
            filterOption={filterResourceOption}
          />
        </Form.Item>
        <Form.Item
          label="Time range I want"
          name="range"
          rules={[
            { required: true, message: 'Please choose a time range' },
            {
              validator: async (_, value?: [Dayjs, Dayjs]) => {
                if (!value?.[0] || !value?.[1]) return;
                if (!value[1].isAfter(value[0])) throw new Error('The end must be after the start');
                if (!value[1].isAfter(dayjs())) throw new Error('The range must end in the future');
                if (value[1].diff(value[0], 'day', true) > MAX_RANGE_DAYS)
                  throw new Error(`A range can span at most ${MAX_RANGE_DAYS} days`);
              },
            },
          ]}
        >
          <DatePicker.RangePicker
            showTime={{ format: 'HH:mm', minuteStep: 5 }}
            format={DATETIMEFORMAT}
            style={{ width: '100%' }}
            disabledDate={(date) => date.isBefore(dayjs().startOf('day'))}
          />
        </Form.Item>
        <Form.Item
          label="Notify me via"
          name="channels"
          rules={[{ required: true, type: 'array', min: 1, message: 'Choose at least one channel' }]}
        >
          <Checkbox.Group options={SLOT_WATCH_CHANNELS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SlotWatchModal;
