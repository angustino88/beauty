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
  message,
} from 'antd';
import type { IAllocateResourcePayload, ResourceKind } from '../types';
import { useCreatePurchaseItemResourceMutation } from '../api';
import {
  useLabsEquipmentRetrieveQuery,
  useLabsBenchesOptionsRetrieveQuery,
  useLabsStationsOptionsRetrieveQuery,
  useLabsLicensesRetrieveQuery,
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
  const [search, setSearch] = useState('');

  const [allocateResource, { isLoading }] = useCreatePurchaseItemResourceMutation();

  // 1. Equipment query (uses full equipment catalog list, does not 400 when empty)
  const { data: equipmentData, isFetching: loadingEquipment } =
    useLabsEquipmentRetrieveQuery(
      { search: search || undefined },
      { skip: !open || selectedKind !== 'equipment' || inputMode !== 'select' },
    );

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

  // 4. Licenses query
  const { data: licenseData, isFetching: loadingLicenses } =
    useLabsLicensesRetrieveQuery(
      {},
      { skip: !open || selectedKind !== 'license' || inputMode !== 'select' },
    );

  const handleFinish = async (values: FormValues) => {
    try {
      const payload: IAllocateResourcePayload = {
        resource_kind: values.resource_kind,
        resource_id: Number(values.resource_id),
        acquisition_price: Number(values.acquisition_price).toFixed(2),
      };

      await allocateResource({ purchaseItemId, body: payload }).unwrap();
      void message.success(
        `Successfully allocated ${values.resource_kind} #${values.resource_id} to purchase line item`,
      );
      form.resetFields();
      onClose();
      onSuccess?.();
    } catch (err) {
      const errorDetail =
        err && typeof err === 'object' && 'data' in err
          ? JSON.stringify((err as { data: unknown }).data)
          : 'Failed to allocate resource';
      void message.error(errorDetail);
    }
  };

  const getSelectOptions = () => {
    if (selectedKind === 'equipment') {
      const list = equipmentData?.data ?? [];
      return list.map((item) => ({
        label: `${item.name}${item.sku ? ` (${item.sku})` : ''} — ID #${item.id}`,
        value: item.id,
      }));
    }
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
    if (selectedKind === 'license') {
      const list = (licenseData?.data as unknown as { id: number; name?: string; key?: string }[]) ?? [];
      return list.map((item) => ({
        label: `${item.name || item.key || 'License'} — ID #${item.id}`,
        value: item.id,
      }));
    }
    return [];
  };

  const isOptionsLoading =
    (selectedKind === 'equipment' && loadingEquipment) ||
    (selectedKind === 'bench' && loadingBenches) ||
    (selectedKind === 'station' && loadingStations) ||
    (selectedKind === 'license' && loadingLicenses);

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
                <span style={{ color: '#fa8c16' }}>
                  No items loaded automatically. You can switch to "Enter ID Directly" above.
                </span>
              ) : undefined
            }
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onSearch={setSearch}
              loading={isOptionsLoading}
              options={options}
              placeholder={`Search and select ${selectedKind}...`}
              style={{ width: '100%' }}
              notFoundContent={
                isOptionsLoading ? 'Loading resources...' : 'No matching resources found'
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
