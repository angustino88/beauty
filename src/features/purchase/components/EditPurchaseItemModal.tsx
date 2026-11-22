import React from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
} from 'antd';
import { getApiErrorMessage, notify } from '@/shared/notifications';
import type { IPurchaseItem, IUpdatePurchaseItemPayload } from '../types';
import { getItemEtag } from '../mapper';
import {
  useGetPurchasePrioritiesQuery,
  useUpdatePurchaseItemMutation,
} from '../api';

interface EditPurchaseItemModalProps {
  open: boolean;
  purchaseId: number;
  item: IPurchaseItem | null;
  currency?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  purpose?: string;
  priority_id?: number;
  notes?: string;
}

const UNIT_OPTIONS = [
  { label: 'Pieces (pcs)', value: 'pcs' },
  { label: 'Units', value: 'units' },
  { label: 'Licenses', value: 'licenses' },
  { label: 'Sets', value: 'sets' },
  { label: 'Meters (m)', value: 'm' },
  { label: 'Boxes', value: 'boxes' },
];

export const EditPurchaseItemModal: React.FC<EditPurchaseItemModalProps> = ({
  open,
  purchaseId,
  item,
  currency = 'EUR',
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [updateItem, { isLoading }] = useUpdatePurchaseItemMutation();
  const { data: priorities = [], isFetching: loadingPriorities } =
    useGetPurchasePrioritiesQuery(undefined, { skip: !open });

  React.useEffect(() => {
    if (item && open) {
      form.setFieldsValue({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        unit_price: parseFloat(item.unit_price || '0'),
        purpose: item.purpose,
        priority_id: item.priority_id,
        notes: item.notes,
      });
    }
  }, [item, open, form]);

  if (!item) return null;

  const handleFinish = async (values: FormValues) => {
    try {
      const payload: IUpdatePurchaseItemPayload = {
        currency,
        description: values.description.trim(),
        quantity: values.quantity,
        unit: values.unit?.trim() || undefined,
        unit_price: Number(values.unit_price).toFixed(2),
        purpose: values.purpose?.trim() || undefined,
        priority_id: values.priority_id,
        notes: values.notes?.trim() || undefined,
      };

      const ifMatch = getItemEtag(item);

      await updateItem({
        purchaseId,
        itemId: item.id,
        body: payload,
        ifMatch,
      }).unwrap();

      notify.success('Line item updated');
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      notify.error('Unable to update line item', {
        description: getApiErrorMessage(err, 'Please review your changes and try again.'),
      });
    }
  };

  return (
    <Modal
      title={`Edit Line Item #${item.id}`}
      open={open}
      onCancel={onClose}
      width={600}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="description"
          label="Item Description"
          rules={[{ required: true, message: 'Please enter item description' }]}
        >
          <Input placeholder="Item description" />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 12px' }}>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Quantity required' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Unit"
          >
            <Select options={UNIT_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="unit_price"
            label={`Unit Price (${currency})`}
            rules={[{ required: true, message: 'Price required' }]}
          >
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <Form.Item name="priority_id" label="Priority">
            <Select
              allowClear
              loading={loadingPriorities}
              placeholder="Select priority"
              options={priorities.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item name="purpose" label="Purpose / Justification">
            <Input placeholder="e.g. Lab calibration requirement" />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} placeholder="Optional line item notes" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
