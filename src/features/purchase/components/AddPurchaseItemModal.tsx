import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Radio,
  Select,
  Segmented,
  Typography,
  message,
} from 'antd';
import { usePagedOptions } from '@/shared/hooks/usePagedOptions';
import type { ICreatePurchaseItemPayload, ResourceKind } from '../types';
import styles from '@/features/finance/components/FinanceWorkspace.module.css';
import {
  useCreatePurchaseItemMutation,
  useCreatePurchaseItemResourceMutation,
  useGetPurchasePrioritiesQuery,
} from '../api';
import {
  useLabsBenchesOptionsRetrieveQuery,
  useLabsStationsOptionsRetrieveQuery,
} from '@/shared/api/generated/api';

interface AddPurchaseItemModalProps {
  open: boolean;
  purchaseId: number;
  currency?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  mode: 'catalog' | 'custom';
  resource_kind: ResourceKind;
  resource_id?: number;
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

const RESOURCE_KINDS: { label: string; value: ResourceKind }[] = [
  { label: 'Equipment Asset', value: 'equipment' },
  { label: 'Lab Bench', value: 'bench' },
  { label: 'Lab Station', value: 'station' },
  { label: 'License', value: 'license' },
];

export const AddPurchaseItemModal: React.FC<AddPurchaseItemModalProps> = ({
  open,
  purchaseId,
  currency = 'EUR',
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedKind, setSelectedKind] = useState<ResourceKind>('equipment');
  const [submitting, setSubmitting] = useState(false);

  const [createItem] = useCreatePurchaseItemMutation();
  const [allocateResource] = useCreatePurchaseItemResourceMutation();
  const { data: priorities = [], isFetching: loadingPriorities } =
    useGetPurchasePrioritiesQuery(undefined, { skip: !open });

  const { data: benchOptions, isFetching: loadingBenches } =
    useLabsBenchesOptionsRetrieveQuery(
      {},
      { skip: !open || mode !== 'catalog' || selectedKind !== 'bench' },
    );

  const { data: stationOptions, isFetching: loadingStations } =
    useLabsStationsOptionsRetrieveQuery(
      {},
      { skip: !open || mode !== 'catalog' || selectedKind !== 'station' },
    );

  // Equipment and licenses are paginated lists: the first page loads when the list opens and the
  // next pages load as the user scrolls, so every item can be reached; typing searches the server.
  const equipmentPaged = usePagedOptions({
    path: '/api/labs/equipment',
    noun: 'equipment',
    enabled: open && mode === 'catalog' && selectedKind === 'equipment',
    toOption: (row: { id: number; name?: string | null; sku?: string | null }) => ({
      label: `${row.name ?? ''}${row.sku ? ` (${row.sku})` : ''} — ID #${row.id}`,
      value: row.id,
        name: row.name ?? '',
        sku: row.sku ?? '',
    }),
  });
  const licensePaged = usePagedOptions({
    path: '/api/labs/licenses',
    noun: 'licenses',
    enabled: open && mode === 'catalog' && selectedKind === 'license',
    toOption: (row: { id: number; name?: string | null; key?: string | null }) => ({
      label: `${row.name || row.key || 'License'} — ID #${row.id}`,
      value: row.id,
        name: row.name || row.key || 'License',
        sku: '',
    }),
  });
  const paged = selectedKind === 'equipment' ? equipmentPaged : selectedKind === 'license' ? licensePaged : null;

  const getSelectOptions = () => {
    if (paged) return paged.options;
    if (selectedKind === 'bench') {
      const list = benchOptions?.data ?? [];
      return list.map((item) => ({
        label: `${item.name}${item.sku ? ` (${item.sku})` : ''} — ID #${item.id}`,
        value: item.id,
        name: item.name,
        sku: item.sku,
      }));
    }
    if (selectedKind === 'station') {
      const list = stationOptions?.data ?? [];
      return list.map((item) => ({
        label: `${item.name}${item.sku ? ` (${item.sku})` : ''} — ID #${item.id}`,
        value: item.id,
        name: item.name,
        sku: item.sku,
      }));
    }
    return [];
  };

  const isOptionsLoading =
    (paged?.loading ?? false) ||
    (selectedKind === 'bench' && loadingBenches) ||
    (selectedKind === 'station' && loadingStations);

  const handleResourceSelect = (val: number) => {
    const opts = getSelectOptions();
    const found = opts.find((o) => o.value === val);
    if (found) {
      const labelText = found.sku ? `${found.name} (${found.sku})` : found.name;
      form.setFieldsValue({
        description: labelText,
      });
    }
  };

  const handleFinish = async (values: FormValues) => {
    try {
      setSubmitting(true);
      const itemPayload: ICreatePurchaseItemPayload = {
        currency,
        description: values.description.trim(),
        quantity: values.quantity,
        unit: values.unit?.trim() || undefined,
        unit_price: Number(values.unit_price).toFixed(2),
        purpose: values.purpose?.trim() || undefined,
        priority_id: values.priority_id,
        notes: values.notes?.trim() || undefined,
      };

      // 1. Create the purchase item line
      const createdItem = await createItem({ purchaseId, body: itemPayload }).unwrap();

      // 2. If a catalog resource was selected, automatically allocate it to this line
      if (mode === 'catalog' && values.resource_id) {
        try {
          await allocateResource({
            purchaseItemId: createdItem.id,
            body: {
              currency,
              resource_kind: values.resource_kind,
              resource_id: Number(values.resource_id),
              acquisition_price: Number(values.unit_price).toFixed(2),
            },
          }).unwrap();
          void message.success(
            `Added item and linked ${values.resource_kind} #${values.resource_id} successfully`,
          );
        } catch {
          void message.warning(
            'Item created, but resource allocation encountered an issue. You can re-link in details.',
          );
        }
      } else {
        void message.success('Line item added successfully');
      }

      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err) {
      const errorDetail =
        err && typeof err === 'object' && 'data' in err
          ? JSON.stringify((err as { data: unknown }).data)
          : 'Failed to add line item';
      void message.error(errorDetail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add Line Item to Purchase Order"
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
        initialValues={{
          mode: 'catalog',
          resource_kind: 'equipment',
          quantity: 1,
          unit_price: 0,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
            Item Source:
          </Typography.Text>
          <Segmented
            block
            value={mode}
            onChange={(val) => {
              setMode(val as 'catalog' | 'custom');
              form.setFieldValue('mode', val);
            }}
            options={[
              { label: 'From catalog', value: 'catalog' },
              { label: 'Custom item', value: 'custom' },
            ]}
          />
        </div>

        {mode === 'catalog' && (
          <div className={styles.formIntro}>
            <Form.Item
              name="resource_kind"
              label={<strong>Resource Kind</strong>}
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <Radio.Group
                buttonStyle="solid"
                style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                onChange={(e) => {
                  const val = e.target.value as ResourceKind;
                  setSelectedKind(val);
                  form.setFieldValue('resource_id', undefined);
                }}
              >
                {RESOURCE_KINDS.map((k) => (
                  <Radio.Button key={k.value} value={k.value}>
                    {k.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="resource_id"
              label={<strong>Select {selectedKind.toUpperCase()} Asset to Link</strong>}
              rules={[{ required: true, message: `Please select the ${selectedKind} resource` }]}
              help="Selecting an asset auto-populates the description and links the acquisition price"
            >
              <Select
                showSearch={paged
                  // Server-searched: the paged list answers the typed text.
                  ? { filterOption: false, onSearch: paged.onSearch }
                  : { filterOption: (input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }}
                onOpenChange={paged?.onOpenChange}
                onPopupScroll={paged?.onPopupScroll}
                popupRender={paged?.popupRender}
                onChange={handleResourceSelect}
                loading={isOptionsLoading}
                options={getSelectOptions()}
                placeholder={`Search ${selectedKind} name or SKU...`}
                style={{ width: '100%' }}
                notFoundContent={paged ? paged.emptyText : isOptionsLoading ? 'Loading resources...' : 'No matching resources found'}
              />
            </Form.Item>
          </div>
        )}

        <Form.Item
          name="description"
          label="Item Description"
          rules={[{ required: true, message: 'Please enter item description' }]}
        >
          <Input placeholder="e.g. Rohde & Schwarz Spectrum Analyzer FPC1500" />
        </Form.Item>

        <div className={styles.formGrid}>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="unit"
            label="Unit"
            initialValue="pcs"
          >
            <Select options={UNIT_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="unit_price"
            label={`Unit Price (${currency})`}
            rules={[{ required: true, message: 'Please enter unit price' }]}
          >
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div className={styles.formGrid}>
          <Form.Item name="priority_id" label="Priority">
            <Select
              allowClear
              loading={loadingPriorities}
              placeholder="Select priority"
              options={priorities.map((p) => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item name="purpose" label="Purpose / Justification">
            <Input placeholder="e.g. Lab expansion, replacing obsolete gear" />
          </Form.Item>
        </div>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} placeholder="Optional procurement notes for this line item" />
        </Form.Item>

        <div className={styles.formActions}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Add Line Item
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
