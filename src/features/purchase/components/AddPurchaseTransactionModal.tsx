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
import type { ICreatePurchaseTransactionPayload, TransactionType } from '../types';
import { useCreatePurchaseTransactionMutation } from '../api';

interface AddPurchaseTransactionModalProps {
  open: boolean;
  purchaseId: number;
  currency: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  transaction_type: TransactionType;
  amount: number;
  settled_at: dayjs.Dayjs;
  reference?: string;
  notes?: string;
}

export const AddPurchaseTransactionModal: React.FC<AddPurchaseTransactionModalProps> = ({
  open,
  purchaseId,
  currency,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [createTransaction, { isLoading }] = useCreatePurchaseTransactionMutation();

  const handleFinish = async (values: FormValues) => {
    try {
      const payload: ICreatePurchaseTransactionPayload = {
        currency,
        transaction_type: values.transaction_type,
        amount: Number(values.amount).toFixed(2),
        settled_at: values.settled_at.toISOString(),
        reference: values.reference?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };

      await createTransaction({ purchaseId, body: payload }).unwrap();
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
          : 'Failed to record transaction';
      void message.error(errorDetail);
    }
  };

  return (
    <Modal
      title={`Record Transaction for Purchase #${purchaseId}`}
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
          settled_at: dayjs(),
          amount: 0,
        }}
      >
        <Form.Item
          name="transaction_type"
          label="Transaction Type"
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
            rules={[{ required: true, message: 'Please enter transaction amount' }]}
          >
            <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="settled_at"
            label="Settled Date / Time"
            rules={[{ required: true, message: 'Please select settled date and time' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="reference" label="Reference / Invoice / Bank Ref">
          <Input placeholder="e.g. WIRE-88491, INV-2026-004" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} placeholder="Optional transaction notes" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Record Transaction
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
