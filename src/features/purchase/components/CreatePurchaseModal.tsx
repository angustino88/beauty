import React from 'react';
import { Modal, Form, Input, DatePicker, InputNumber, Select, Button, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '@/features/finance/components/FinanceWorkspace.module.css';
import type { ICreatePurchasePayload } from '../types';
import { useCreatePurchaseMutation } from '../api';

interface CreatePurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  supplier: string;
  purchase_order_number?: string;
  purchase_date: dayjs.Dayjs;
  currency: string;
  total_amount: number;
  notes?: string;
  items?: { description: string; quantity: number; unit_price: number; notes?: string }[];
}

const CURRENCY_OPTIONS = [
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'JPY (¥)', value: 'JPY' },
  { label: 'CHF (Fr)', value: 'CHF' },
];

export const CreatePurchaseModal: React.FC<CreatePurchaseModalProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm<FormValues>();
  const [createPurchase, { isLoading }] = useCreatePurchaseMutation();

  const handleFinish = async (values: FormValues) => {
    try {
      const payload: ICreatePurchasePayload = {
        supplier: values.supplier.trim(),
        purchase_order_number: values.purchase_order_number?.trim() || undefined,
        purchase_date: values.purchase_date.format('YYYY-MM-DD'),
        currency: values.currency,
        total_amount: Number(values.total_amount).toFixed(2),
        notes: values.notes?.trim() || undefined,
        items: values.items?.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: Number(item.unit_price).toFixed(2),
          notes: item.notes?.trim() || undefined,
        })),
      };
      const created = await createPurchase(payload).unwrap();
      const orderReference = payload.purchase_order_number || (created && typeof created === 'object' && 'id' in created ? `#${String(created.id)}` : undefined);
      void message.success(orderReference
        ? `Purchase order ${orderReference} for ${payload.supplier} created successfully.`
        : `Purchase order for ${payload.supplier} created successfully.`);
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err) {
      const errorDetail = err && typeof err === 'object' && 'data' in err
        ? JSON.stringify((err as { data: unknown }).data)
        : 'Failed to create purchase order';
      void message.error(errorDetail);
    }
  };

  return (
    <Modal
      title="New purchase order"
      open={open}
      onCancel={onClose}
      width={760}
      footer={null}
      destroyOnClose
      styles={{ body: { maxHeight: 'min(76vh, 850px)', overflowY: 'auto' } }}
    >
      <div className={styles.formIntro}>
        <strong>Start with a draft</strong>
        Add the supplier and agreed amount now. Line items are optional; you can add more, link equipment and record payments after saving.
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ purchase_date: dayjs(), currency: 'EUR', total_amount: 0 }}
      >
        <div className={styles.formSection}>Order information<small>Details shared with your procurement team.</small></div>
        <div className={styles.formGrid}>
          <Form.Item className={styles.formFull} name="supplier" label="Supplier / vendor" rules={[{ required: true, whitespace: true, message: 'Please enter the supplier name' }]}>
            <Input placeholder="e.g. Keysight Technologies" />
          </Form.Item>
          <Form.Item name="purchase_order_number" label="PO number (optional)">
            <Input placeholder="e.g. PO-2026-0881" />
          </Form.Item>
          <Form.Item name="purchase_date" label="Order date" rules={[{ required: true, message: 'Please select an order date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currency" label="Currency" rules={[{ required: true, message: 'Please select currency' }]}>
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>
          <Form.Item name="total_amount" label="Agreed order amount" rules={[{ required: true, message: 'Please enter the agreed amount' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={2} placeholder="0.00" />
          </Form.Item>
          <Form.Item className={styles.formFull} name="notes" label="Notes / justification (optional)">
            <Input.TextArea rows={2} placeholder="Add context for this order" />
          </Form.Item>
        </div>
        <div className={styles.formSection}>Line items<small>Optional at draft stage. Link equipment and other assets from the order details after saving.</small></div>
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className={styles.lineItem}>
                  <div className={styles.lineItemHeading}>
                    <span>Item {name + 1}</span>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} aria-label={`Remove item ${name + 1}`}>Remove</Button>
                  </div>
                  <div className={styles.formGrid}>
                    <Form.Item {...restField} className={styles.formFull} name={[name, 'description']} label="Item description" rules={[{ required: true, whitespace: true, message: 'Description required' }]}>
                      <Input placeholder="e.g. Lab workstation" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'quantity']} label="Quantity" rules={[{ required: true, message: 'Quantity required' }]}>
                      <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'unit_price']} label="Unit price" rules={[{ required: true, message: 'Price required' }]}>
                      <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
                    </Form.Item>
                  </div>
                </div>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ quantity: 1, unit_price: 0 })} block icon={<PlusOutlined />}>Add line item</Button>
              </Form.Item>
            </>
          )}
        </Form.List>
        <div className={styles.formActions}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>Save as draft</Button>
        </div>
      </Form>
    </Modal>
  );
};
