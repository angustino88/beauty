import React, { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Button,
  Radio,
  Segmented,
  Typography,
} from 'antd';
import { usePagedOptions } from '@/shared/hooks/usePagedOptions';
import { getApiErrorMessage, notify } from '@/shared/notifications';
import type { IAllocateResourcePayload, ResourceKind } from '../types';
import { useCreatePurchaseItemResourceMutation } from '../api';
import {
  useLabsBenchesOptionsRetrieveQuery,
  useLabsStationsOptionsRetrieveQuery,
} from '@/shared/api/generated/api';

interface AllocateResourceModalProps {
  open: boolean;
  purchaseItemId: number;
  itemDescription: string;
  defaultAcquisitionPrice?: string;
  currency?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  resource_kind: ResourceKind;
  resource_id: number;
  acquisition_price: number;
}

const RESOURCE_KINDS: { label: string; value: ResourceKind }[] = [
  { label: 'Equipment Asset', value: 'equipment' },
  { label: 'Lab Bench', value: 'bench' },
  { label: 'Lab Station', value: 'station' },
  { label: 'Software License', value: 'license' },
];

export const AllocateResourceModal: React.FC<AllocateResourceModalProps> = ({
  open,
  purchaseItemId,
  itemDescription,
  defaultAcquisitionPrice = '0.00',
  currency = 'EUR',
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [selectedKind, setSelectedKind] = useState<ResourceKind>('equipment');
  const [inputMode, setInputMode] = useState<'select' | 'manual'>('select');

  const [allocateResource, { isLoading }] = useCreatePurchaseItemResourceMutation();

  // 2. Benches options query
  const { data: benchOptions, isFetching: loadingBenches } =
    useLabsBenchesOptionsRetrieveQuery(
      {},
      { skip: !open || selectedKind !== 'bench' || inputMode !== 'select' },
    );

  // 3. Stations options query
  const { data: stationOptions, isFetching: loadingStations } =
    useLabsStationsOptionsRetrieveQuery(
      {},
      { skip: !open || selectedKind !== 'station' || inputMode !== 'select' },
    );

  const handleFinish = async (values: FormValues) => {
    try {
      const payload: IAllocateResourcePayload = {
        currency,
        resource_kind: values.resource_kind,
        resource_id: Number(values.resource_id),
        acquisition_price: Number(values.acquisition_price).toFixed(2),
      };

      await allocateResource({ purchaseItemId, body: payload }).unwrap();
      notify.success('Resource allocated', {
        description: `Linked ${values.resource_kind} #${values.resource_id} to this line item.`,
      });
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err) {
      notify.error('Unable to allocate resource', {
        description: getApiErrorMessage(err, 'Please review the selection and try again.'),
      });
    }
  };

  // Equipment and licenses are paginated lists: the first page loads when the list opens and the
  // next pages load as the user scrolls, so every item can be reached; typing searches the server.
  const equipmentPaged = usePagedOptions({
    path: '/api/labs/equipment',
    noun: 'equipment',
    enabled: open && inputMode === 'select' && selectedKind === 'equipment',
    toOption: (row: { id: number; name?: string | null; sku?: string | null }) => ({
      label: `${row.name ?? ''}${row.sku ? ` (${row.sku})` : ''} — ID #${row.id}`,
      value: row.id,
    }),
  });
  const licensePaged = usePagedOptions({
    path: '/api/labs/licenses',
    noun: 'licenses',
    enabled: open && inputMode === 'select' && selectedKind === 'license',
    toOption: (row: { id: number; name?: string | null; key?: string | null }) => ({
      label: `${row.name || row.key || 'License'} — ID #${row.id}`,
      value: row.id,
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
      }));
    }
    if (selectedKind === 'station') {
      const list = stationOptions?.data ?? [];
      return list.map((item) => ({
        label: `${item.name}${item.sku ? ` (${item.sku})` : ''} — ID #${item.id}`,
        value: item.id,
      }));
    }
    return [];
  };

  const isOptionsLoading =
    (paged?.loading ?? false) ||
    (selectedKind === 'bench' && loadingBenches) ||
    (selectedKind === 'station' && loadingStations);

  const initialPrice = parseFloat(defaultAcquisitionPrice || '0');
  const options = getSelectOptions();

  return (
    <Modal
      title={
        <div>
          <span>Allocate Physical Resource</span>
          <Typography.Paragraph
            type="secondary"
            ellipsis
            style={{ margin: 0, fontSize: 13, fontWeight: 'normal' }}
          >
            Line Item: <strong>{itemDescription}</strong>
          </Typography.Paragraph>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={640}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          resource_kind: 'equipment',
          acquisition_price: initialPrice,
        }}
      >
        <Form.Item
          name="resource_kind"
          label="Resource Kind"
          rules={[{ required: true }]}
        >
          <Radio.Group
            buttonStyle="solid"
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

        <div style={{ marginBottom: 12 }}>
          <Segmented
            value={inputMode}
            onChange={(val) => setInputMode(val as 'select' | 'manual')}
            options={[
              { label: 'Choose from Catalog', value: 'select' },
              { label: 'Enter ID Directly', value: 'manual' },
            ]}
          />
        </div>

        {inputMode === 'select' ? (
          <Form.Item
            name="resource_id"
            label={`Select ${selectedKind.toUpperCase()}`}
            rules={[{ required: true, message: `Please select a ${selectedKind}` }]}
            extra={
              options.length === 0 && !isOptionsLoading ? (
                <span style={{ color: 'var(--lm-warning-solid)' }}>
                  No items loaded automatically. You can switch to "Enter ID Directly" above.
                </span>
              ) : undefined
            }
          >
            <Select
              showSearch={paged
                // Server-searched: the paged list answers the typed text.
                ? { filterOption: false, onSearch: paged.onSearch }
                : { filterOption: (input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }}
              onOpenChange={paged?.onOpenChange}
              onPopupScroll={paged?.onPopupScroll}
              popupRender={paged?.popupRender}
              loading={isOptionsLoading}
              options={options}
              placeholder={`Search and select ${selectedKind}...`}
              style={{ width: '100%' }}
              notFoundContent={
                paged ? paged.emptyText : isOptionsLoading ? 'Loading resources...' : 'No matching resources found'
              }
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="resource_id"
            label={`${selectedKind.toUpperCase()} ID`}
            rules={[{ required: true, message: `Please enter numeric ${selectedKind} ID` }]}
            help={`Enter the primary key ID of the target ${selectedKind} in the system.`}
          >
            <InputNumber
              min={1}
              placeholder={`e.g. 101`}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        <Form.Item
          name="acquisition_price"
          label={`Unit Acquisition Price (${currency})`}
          rules={[{ required: true, message: 'Please specify acquisition price' }]}
          extra="This value will be audited and recorded as the official acquisition price on the resource."
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Allocate to Purchase Line
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
