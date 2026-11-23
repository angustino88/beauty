import React from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
} from 'antd';
import dayjs from 'dayjs';
import styles from '@/features/finance/components/FinanceWorkspace.module.css';
import { getApiErrorMessage, notify } from '@/shared/notifications';
import type { BillingPeriodEnum, ExpenseTypeEnum, ICreateExpensePayload } from '../types';
import { EXPENSE_TYPE_LABELS, BILLING_PERIOD_LABELS } from '../mapper';
import { useCreateRoomExpenseMutation } from '../api';
import type { IRoomOption } from '../api';

interface CreateExpenseModalProps {
  open: boolean;
  rooms: IRoomOption[];
  defaultRoomId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  room_id: number;
  name: string;
  expense_type: ExpenseTypeEnum;
  billing_period: BillingPeriodEnum;
  amount: number;
  currency: string;
  valid_from: dayjs.Dayjs;
  valid_until?: dayjs.Dayjs;
  supplier?: string;
  reference?: string;
  notes?: string;
}

const CURRENCY_OPTIONS = [
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'JPY (¥)', value: 'JPY' },
  { label: 'CHF (Fr)', value: 'CHF' },
];

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  open,
  rooms,
  defaultRoomId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [createExpense, { isLoading }] = useCreateRoomExpenseMutation();

  const handleFinish = async (values: FormValues) => {
    try {
      const payload: ICreateExpensePayload = {
        name: values.name.trim(),
        expense_type: values.expense_type,
        billing_period: values.billing_period,
        amount: Number(values.amount).toFixed(2),
        currency: values.currency,
        valid_from: values.valid_from.format('YYYY-MM-DD'),
        valid_until: values.valid_until ? values.valid_until.format('YYYY-MM-DD') : null,
        supplier: values.supplier?.trim() || undefined,
        reference: values.reference?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };

      await createExpense({
        roomId: values.room_id,
        body: payload,
      }).unwrap();

      notify.success('Expense created', {
        description: `Saved "${payload.name}".`,
      });
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err) {
      notify.error('Unable to create expense', {
        description: getApiErrorMessage(err, 'Please review the expense details and try again.'),
      });
    }
  };

  const expenseTypeOptions = Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => ({
    label,
    value,
  }));

  const billingPeriodOptions = Object.entries(BILLING_PERIOD_LABELS).map(([value, label]) => ({
    label,
    value,
  }));

  return (
    <Modal
      title="Create Room Expense"
      open={open}
      onCancel={onClose}
      width={680}
      footer={null}
      destroyOnClose
      styles={{ body: { maxHeight: 'min(76vh, 850px)', overflowY: 'auto' } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          room_id: defaultRoomId ?? rooms[0]?.id,
          expense_type: 'maintenance',
          billing_period: 'monthly',
          currency: 'EUR',
          valid_from: dayjs(),
          amount: 0,
        }}
      >
        <div className={styles.formIntro}><strong>New facility obligation</strong>Specify the room and billing schedule first. Track payments from the expense details after creation.</div>
        <div className={styles.formGrid}>
          <Form.Item
            className={styles.formFull}
            name="room_id"
            label="Lab Facility / Room"
            rules={[{ required: true, message: 'Please select a lab room or zone' }]}
            help="Select the lab room or facility zone where this expense is incurred"
          >
            <Select
              options={rooms.map((r) => ({ label: r.name, value: r.id }))}
              placeholder="Select lab room or zone"
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Expense Name"
            rules={[{ required: true, message: 'Please enter expense name' }]}
          >
            <Input placeholder="e.g. Monthly Electricity, Annual HVAC Check" />
          </Form.Item>

          <Form.Item
            name="expense_type"
            label="Expense Type"
            rules={[{ required: true, message: 'Please select expense type' }]}
          >
            <Select options={expenseTypeOptions} />
          </Form.Item>

          <Form.Item
            name="billing_period"
            label="Billing Period"
            rules={[{ required: true, message: 'Please select billing period' }]}
          >
            <Select options={billingPeriodOptions} />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="currency"
            label="Currency"
            rules={[{ required: true, message: 'Please select currency' }]}
          >
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="valid_from"
            label="Valid From"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="valid_until" label="Valid Until (Optional)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="supplier" label="Supplier / Vendor">
            <Input placeholder="e.g. Stadtwerke, EnBW, Facility Co" />
          </Form.Item>

          <Form.Item name="reference" label="Contract / Invoice Ref">
            <Input placeholder="e.g. CON-2026-99" />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} placeholder="Optional expense details or contract terms" />
        </Form.Item>

        <div className={styles.formActions}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Create Expense
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
