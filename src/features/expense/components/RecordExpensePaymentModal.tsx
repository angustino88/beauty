import React from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  DatePicker,
  Button,
  message,
} from 'antd';
import dayjs from 'dayjs';
import type { ICreateExpensePaymentPayload } from '../types';
import { useCreateExpensePaymentMutation } from '../api';

interface RecordExpensePaymentModalProps {
  open: boolean;
  expenseId: number;
  expenseName: string;
  currency: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  transaction_type: 'payment' | 'refund';
  amount: number;
  paid_at: dayjs.Dayjs;
  reference?: string;
  notes?: string;
}

export const RecordExpensePaymentModal: React.FC<RecordExpensePaymentModalProps> = ({
  open,
  expenseId,
  expenseName,
  currency,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [createPayment, { isLoading }] = useCreateExpensePaymentMutation();

  const handleFinish = async (values: FormValues) => {
    try {
      const payload: ICreateExpensePaymentPayload = {
        transaction_type: values.transaction_type,
        amount: Number(values.amount).toFixed(2),
        paid_at: values.paid_at.format('YYYY-MM-DD'),
        reference: values.reference?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };

      await createPayment({ expenseId, body: payload }).unwrap();
      void message.success(
        values.transaction_type === 'refund'
          ? 'Refund recorded successfully'
          : 'Payment recorded successfully',
      );
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err) {
      const errorDetail =
        err && typeof err === 'object' && 'data' in err
          ? JSON.stringify((err as { data: unknown }).data)
          : 'Failed to record payment';
      void message.error(errorDetail);
    }
  };

  return (
    <Modal
      title={`Record Payment for: "${expenseName}"`}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          transaction_type: 'payment',
          paid_at: dayjs(),
          amount: 0,
        }}
      >
        <Form.Item
          name="transaction_type"
          label="Payment Type"
          rules={[{ required: true }]}
        >
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="payment">Payment</Radio.Button>
            <Radio.Button value="refund">Refund</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item
            name="amount"
            label={`Amount (${currency})`}
            rules={[{ required: true, message: 'Please enter payment amount' }]}
          >
            <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="paid_at"
            label="Payment Date"
            rules={[{ required: true, message: 'Please select payment date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="reference" label="Reference / Bank Transaction ID">
          <Input placeholder="e.g. SEPA-2026-991, REF-0012" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} placeholder="Optional payment remarks" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Record Payment
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
