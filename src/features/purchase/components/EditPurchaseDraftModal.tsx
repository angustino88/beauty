import React from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Button,
} from 'antd';
import dayjs from 'dayjs';
import styles from '@/features/finance/components/FinanceWorkspace.module.css';
import { getApiErrorMessage, notify } from '@/shared/notifications';
import detailStyles from './PurchaseDetail.module.css';
import type { IPurchase, IUpdatePurchaseDraftHeaderPayload } from '../types';
import { getPurchaseEtag } from '../mapper';
import { useGetPurchaseByIdQuery, useUpdatePurchaseDraftHeaderMutation } from '../api';

interface EditPurchaseDraftModalProps {
  open: boolean;
  purchase: IPurchase | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  supplier: string;
  purchase_order_number?: string;
  purchase_date: dayjs.Dayjs;
  currency: string;
  total_amount: number;
  status: string;
  notes?: string;
}

const CURRENCY_OPTIONS = [
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'JPY (¥)', value: 'JPY' },
  { label: 'CHF (Fr)', value: 'CHF' },
];

const STATUS_OPTIONS = [
  { label: 'Draft (In Preparation)', value: 'draft' },
  { label: 'Ordered (PO Issued)', value: 'ordered' },
  { label: 'Received (Goods Arrived)', value: 'received' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const EditPurchaseDraftModal: React.FC<EditPurchaseDraftModalProps> = ({
  open,
  purchase,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [updateDraftHeader, { isLoading }] = useUpdatePurchaseDraftHeaderMutation();

  const purchaseId = purchase?.id ?? 0;
  const { data: freshPurchase } = useGetPurchaseByIdQuery(purchaseId, {
    skip: !purchaseId || !open,
  });
  const currentPurchase = freshPurchase || purchase;

  React.useEffect(() => {
    if (currentPurchase && open) {
      form.setFieldsValue({
        supplier: currentPurchase.supplier,
        purchase_order_number: currentPurchase.purchase_order_number,
        purchase_date: currentPurchase.purchase_date ? dayjs(currentPurchase.purchase_date) : dayjs(),
        currency: currentPurchase.currency || 'EUR',
        total_amount: parseFloat(currentPurchase.total_amount || '0'),
        status: (currentPurchase.status || 'draft').toLowerCase(),
        notes: currentPurchase.notes,
      });
    }
  }, [currentPurchase, open, form]);

  if (!purchase) return null;

  const handleFinish = async (values: FormValues) => {
    try {
      const payload: IUpdatePurchaseDraftHeaderPayload = {
        supplier: values.supplier.trim(),
        purchase_order_number: values.purchase_order_number?.trim() || undefined,
        purchase_date: values.purchase_date.format('YYYY-MM-DD'),
        currency: values.currency,
        total_amount: Number(values.total_amount).toFixed(2),
        notes: values.notes?.trim() || undefined,
      };

      const ifMatch = getPurchaseEtag(currentPurchase);

      await updateDraftHeader({
        purchaseId: purchase.id,
        body: payload,
        ifMatch,
      }).unwrap();

      notify.success('Purchase order updated');
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      notify.error('Unable to update purchase order', {
        description: getApiErrorMessage(err, 'Please review your changes and try again.'),
      });
    }
  };

  return (
    <Modal
      title={
        <div>
          Edit order details
          <p className={detailStyles.editSubtitle}>
            {purchase.purchase_order_number || `Order #${purchase.id}`} · {purchase.supplier}
          </p>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={640}
      footer={null}
      destroyOnClose
      styles={{ body: { maxHeight: 'min(76vh, 850px)', overflowY: 'auto' } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <h3 className={detailStyles.editSection}>Supplier & reference</h3>
        <div className={styles.formGrid}>
          <Form.Item
            className={styles.formFull}
            name="supplier"
            label="Supplier"
            rules={[{ required: true, whitespace: true, message: 'Please enter the supplier name' }]}
          >
            <Input placeholder="Supplier name" />
          </Form.Item>

          <Form.Item name="purchase_order_number" label="PO number">
            <Input placeholder="e.g. PO-2026-001" />
          </Form.Item>

          <Form.Item
            name="purchase_date"
            label="Order date"
            rules={[{ required: true, message: 'Please select purchase date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div className={detailStyles.editDivider} />
        <h3 className={detailStyles.editSection}>Commercial details</h3>
        <div className={styles.formGrid}>
          <Form.Item
            name="currency"
            label="Currency"
            rules={[{ required: true, message: 'Please select currency' }]}
          >
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="total_amount"
            label="Agreed order value"
            rules={[{ required: true, message: 'Please enter total amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              precision={2}
            />
          </Form.Item>
        </div>
        <div className={detailStyles.editDivider} />
        <h3 className={detailStyles.editSection}>Status & notes</h3>
        <Form.Item
          name="status"
          label="Order status"
          extra="Status cannot be changed during draft editing"
        >
          <Select options={STATUS_OPTIONS} disabled />
        </Form.Item>
        <Form.Item name="notes" label="Procurement notes (optional)">
          <Input.TextArea rows={3} placeholder="Add context, supplier terms or procurement notes" />
        </Form.Item>

        <div className={styles.formActions}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
