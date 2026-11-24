import React, { useState } from 'react';
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
import {
  useLabsBenchesOptionsRetrieveQuery,
  useLabsStationsOptionsRetrieveQuery,
} from '@/shared/api/generated/api';
import { usePagedOptions } from '@/shared/hooks/usePagedOptions';
import { getApiErrorMessage, notify } from '@/shared/notifications';
import type { BillingPeriodEnum, ExpenseResourceKind, ExpenseTypeEnum } from '../types';
import {
  BILLING_PERIOD_LABELS,
  EXPENSE_RESOURCE_KIND_LABELS,
  EXPENSE_TYPE_LABELS,
} from '../mapper';
import { useCreateExpenseMutation } from '../api';
import type { IRoomOption } from '../api';

interface CreateExpenseModalProps {
  open: boolean;
  rooms: IRoomOption[];
  defaultResourceKind?: ExpenseResourceKind;
  defaultRoomId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormValues {
  resource_kind: ExpenseResourceKind;
  resource_id: number;
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

const RESOURCE_KIND_OPTIONS = (
  Object.entries(EXPENSE_RESOURCE_KIND_LABELS) as [ExpenseResourceKind, string][]
).map(([value, label]) => ({ value, label }));

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  open,
  rooms,
  defaultResourceKind = 'room',
  defaultRoomId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [selectedKind, setSelectedKind] = useState<ExpenseResourceKind>(defaultResourceKind);
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const { data: benchOptions, isFetching: loadingBenches } =
    useLabsBenchesOptionsRetrieveQuery({}, { skip: !open || selectedKind !== 'bench' });
  const { data: stationOptions, isFetching: loadingStations } =
    useLabsStationsOptionsRetrieveQuery({}, { skip: !open || selectedKind !== 'station' });

  const equipmentPaged = usePagedOptions({
    path: '/api/labs/equipment',
    noun: 'equipment',
    enabled: open && selectedKind === 'equipment',
    toOption: (row: { id: number; name?: string | null; sku?: string | null }) => ({
      label: `${row.name ?? ''}${row.sku ? ` (${row.sku})` : ''} — ID #${row.id}`,
      value: row.id,
    }),
  });

  const licensePaged = usePagedOptions({
    path: '/api/labs/licenses',
    noun: 'licenses',
    enabled: open && selectedKind === 'license',
    toOption: (row: { id: number; name?: string | null; sku?: string | null }) => ({
      label: `${row.name || row.sku || 'License'}${row.sku && row.name ? ` (${row.sku})` : ''} — ID #${row.id}`,
      value: row.id,
    }),
  });

  const paged =
    selectedKind === 'equipment'
      ? equipmentPaged
      : selectedKind === 'license'
        ? licensePaged
        : null;

  const resourceOptions = (() => {
    if (paged) return paged.options;
    if (selectedKind === 'room') {
      return rooms.map((r) => ({ label: r.name, value: r.id }));
    }
    if (selectedKind === 'bench') {
      return (benchOptions?.data ?? []).map((item) => ({
        label: `${item.name}${item.sku ? ` (${item.sku})` : ''} — ID #${item.id}`,
        value: item.id,
      }));
    }
    if (selectedKind === 'station') {
      return (stationOptions?.data ?? []).map((item) => ({
        label: `${item.name}${item.sku ? ` (${item.sku})` : ''} — ID #${item.id}`,
        value: item.id,
      }));
    }
    return [];
  })();

  const isResourceOptionsLoading =
    (paged?.loading ?? false) ||
    (selectedKind === 'bench' && loadingBenches) ||
    (selectedKind === 'station' && loadingStations);

  const handleFinish = async (values: FormValues) => {
    try {
      const name = values.name.trim();
      await createExpense({
        resource_kind: values.resource_kind,
        resource_id: Number(values.resource_id),
        name,
        expense_type: values.expense_type,
        billing_period: values.billing_period,
        amount: Number(values.amount).toFixed(2),
        currency: values.currency,
        valid_from: values.valid_from.format('YYYY-MM-DD'),
        valid_until: values.valid_until ? values.valid_until.format('YYYY-MM-DD') : null,
        supplier: values.supplier?.trim() || undefined,
        reference: values.reference?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      }).unwrap();

      notify.success('Expense created', {
        description: `Saved "${name}".`,
      });
      form.resetFields();
      setSelectedKind(defaultResourceKind);
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
      title="Create Resource Expense"
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
          resource_kind: defaultResourceKind,
          resource_id: defaultResourceKind === 'room' ? (defaultRoomId ?? rooms[0]?.id) : undefined,
          expense_type: defaultResourceKind === 'license' ? 'license_fee' : 'maintenance',
          billing_period: 'monthly',
          currency: 'EUR',
          valid_from: dayjs(),
          amount: 0,
        }}
      >
        <div className={styles.formIntro}>
          <strong>New operational obligation</strong>
          Attach an ongoing cost to a room, station, bench, equipment item, or software license, then record payments from its detail drawer.
        </div>
        <div className={styles.formGrid}>
          <Form.Item
            name="resource_kind"
            label="Resource Type"
            rules={[{ required: true, message: 'Please select a resource type' }]}
          >
            <Select
              options={RESOURCE_KIND_OPTIONS}
              onChange={(kind: ExpenseResourceKind) => {
                setSelectedKind(kind);
                form.setFieldValue('resource_id', kind === 'room' ? (defaultRoomId ?? rooms[0]?.id) : undefined);
                if (kind === 'license') {
                  form.setFieldValue('expense_type', 'license_fee');
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="resource_id"
            label={`Target ${EXPENSE_RESOURCE_KIND_LABELS[selectedKind]}`}
            rules={[{ required: true, message: `Please select a ${selectedKind}` }]}
          >
            <Select
              showSearch
              loading={isResourceOptionsLoading}
              options={resourceOptions}
              placeholder={`Select ${selectedKind}...`}
              filterOption={paged ? false : (input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              onSearch={paged ? paged.onSearch : undefined}
              onPopupScroll={paged ? paged.onPopupScroll : undefined}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Expense Name"
            rules={[{ required: true, message: 'Please enter expense name' }]}
          >
            <Input placeholder="e.g. Monthly Electricity, Annual CANoe Renewal" />
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
            <Input placeholder="e.g. Vector, Stadtwerke, Facility Co" />
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
