import { BellOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { DatePicker, Form, Modal, Select } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { filterResourceOption } from '@/components/inputs/ResourceOption';
import { DATETIMEFORMAT } from '@/shared/utils/booking';
import { useGetBookingBenchChoicesQuery } from '../api';
import { formatAlertWindow } from '../slotWatchMapper';
import { toBenchChoiceOption } from '../utils/benchChoiceOption';
import bookingStyles from '../components/BookingModal.module.css';
import styles from './SlotAlerts.module.css';
import { useSlotAlert } from './useSlotAlert';

type FormValues = { bench_id: number; range: [Dayjs, Dayjs] };

export type SlotAlertModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: { benchId?: number; startsAt?: Dayjs; endsAt?: Dayjs };
};

const MAX_RANGE_DAYS = 7;
const roundUp = (value: Dayjs) => value.add(15 - (value.minute() % 15), 'minute').second(0).millisecond(0);

/** Quick choices so most alerts take two clicks: pick a bench, pick a preset. */
const presets = () => {
  const now = roundUp(dayjs());
  const tomorrow = dayjs().add(1, 'day').startOf('day');
  return [
    { label: 'Next 2 hours', value: [now, now.add(2, 'hour')] as [Dayjs, Dayjs] },
    { label: 'Rest of today', value: [now, dayjs().endOf('day').startOf('minute')] as [Dayjs, Dayjs] },
    { label: 'Tomorrow morning', value: [tomorrow.hour(8), tomorrow.hour(12)] as [Dayjs, Dayjs] },
    { label: 'Tomorrow afternoon', value: [tomorrow.hour(13), tomorrow.hour(18)] as [Dayjs, Dayjs] },
    { label: 'Tomorrow (working day)', value: [tomorrow.hour(8), tomorrow.hour(18)] as [Dayjs, Dayjs] },
  ];
};

export function SlotAlertModal({ open, onClose, initial }: SlotAlertModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const { createAlert } = useSlotAlert();
  const { data: benchChoices } = useGetBookingBenchChoicesQuery({ includeId: null, hasComputing: true });
  const benchOptions = useMemo(() => (benchChoices ?? []).map((bench) => toBenchChoiceOption(bench)), [benchChoices]);
  const benchId = Form.useWatch('bench_id', form);
  const range = Form.useWatch('range', form);
  const benchName = benchChoices?.find((bench) => bench.id === benchId)?.name;

  useEffect(() => {
    if (!open) return;
    const start = initial?.startsAt ?? roundUp(dayjs());
    form.setFieldsValue({ bench_id: initial?.benchId, range: [start, initial?.endsAt ?? start.add(2, 'hour')] });
  }, [open, initial, form]);

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    const ok = await createAlert({ benchId: values.bench_id, startsAt: values.range[0], endsAt: values.range[1] });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="Create alert"
      cancelText="Cancel"
      className={bookingStyles.bookingModal}
      destroyOnHidden
      width={520}
      title={
        <div className={bookingStyles.modalTitle}>
          <BellOutlined />
          <div>New slot alert</div>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <Form.Item label="Bench" name="bench_id" rules={[{ required: true, message: 'Choose the bench you need' }]}>
          <Select
            showSearch
            autoFocus
            placeholder="Search by bench SKU or computer name"
            options={benchOptions}
            optionLabelProp="selectedLabel"
            filterOption={filterResourceOption}
          />
        </Form.Item>
        <Form.Item
          label="When do you need it?"
          name="range"
          extra="Pick a preset or set your own start and end."
          rules={[
            { required: true, message: 'Choose when you need the bench' },
            {
              validator: async (_, value?: [Dayjs, Dayjs]) => {
                if (!value?.[0] || !value?.[1]) return;
                if (!value[1].isAfter(value[0])) throw new Error('The end must be after the start');
                if (!value[1].isAfter(dayjs())) throw new Error('Choose a time in the future');
                if (value[1].diff(value[0], 'day', true) > MAX_RANGE_DAYS)
                  throw new Error(`Alerts can cover up to ${MAX_RANGE_DAYS} days`);
              },
            },
          ]}
        >
          <DatePicker.RangePicker
            showTime={{ format: 'HH:mm', minuteStep: 15 }}
            format={DATETIMEFORMAT}
            presets={presets()}
            style={{ width: '100%' }}
            disabledDate={(date) => date.isBefore(dayjs().startOf('day'))}
          />
        </Form.Item>
      </Form>
      <div className={styles.summary}>
        <InfoCircleOutlined className={styles.summaryIcon} />
        <div>
          {benchName && range?.[0] && range?.[1] ? (
            <>
              We'll alert you when <strong>{benchName}</strong> has free time{' '}
              <strong>{formatAlertWindow(range[0].toISOString(), range[1].toISOString())}</strong>
              {' '}— when the current booking is about to end, or is cancelled or finished early.
            </>
          ) : (
            <>We'll alert you when the booking in your way is about to end, or is cancelled or finished early.</>
          )}{' '}
          Alerts arrive in Lab Mango, by email and in Teams. The slot isn't held, so book it as soon as you're notified.
        </div>
      </div>
    </Modal>
  );
}

export default SlotAlertModal;
