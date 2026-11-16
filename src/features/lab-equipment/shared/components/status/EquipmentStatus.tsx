import { useEffect, useMemo, useState } from 'react';
import { Alert, DatePicker, Form, Input, Select, message } from 'antd';
import { FormDialog } from '@/components/ui/form-dialog';
import { equipmentStatusLabel, equipmentStatusTone, equipmentStatusValue } from '../../utils/equipmentStatus';
import {
  firstBorrowBlocker,
  getAvailableStatusStep,
  getEquipmentStatusActionOptions,
  isLifecycleTargetBlocked,
  type EquipmentStatusActionValue,
} from '../../utils/equipmentStatusActions';
import styles from './EquipmentStatus.module.css';
import { StatusBadge } from '@/shared/components/StatusBadge';
import dayjs, { type Dayjs } from 'dayjs';
import type {
  EquipmentChangeCondition,
  EquipmentChangeLifecycle,
  EquipmentHandOver,
  EquipmentPlacementWrite,
  EquipmentReturn,
} from '@/shared/api/generated/api';
import type { EquipmentItem } from '../../../types/equipment';

export default function EquipmentStatus({ status }: { status: unknown }) {
  return <StatusBadge tone={equipmentStatusTone(status)} label={equipmentStatusLabel(status)} className={styles.badge} />;
}

export type EquipmentStatusAction =
  | { action: 'condition'; body: EquipmentChangeCondition }
  | { action: 'lifecycle'; body: EquipmentChangeLifecycle }
  | { action: 'placement'; body: EquipmentPlacementWrite }
  | { action: 'clear-placement' }
  | { action: 'hand-over'; body: EquipmentHandOver }
  | { action: 'return'; body: EquipmentReturn };

interface UpdateEquipmentStatusModalProps {
  open: boolean;
  record: EquipmentItem;
  capabilities: string[];
  benchOptions: Array<{ id: number; name: string; sku?: string | null }>;
  roomOptions: Array<{ id: number; name: string; sku?: string | null }>;
  stationOptions: Array<{ id: number; name: string; sku?: string | null }>;
  borrowerOptions: Array<{ id: number; name: string }>;
  loadingOptions?: boolean;
  onSearchBorrowers: (value: string) => void;
  onSearchLocations: (value: string) => void;
  onSave: (payload: EquipmentStatusAction) => Promise<void>;
  onCancel: () => void;
}

type DisplayAction = EquipmentStatusActionValue;
interface FormValues {
  action: DisplayAction;
  reason?: string;
  receiving_organisation?: string;
  transfer_date?: Dayjs;
  bench_id?: number;
  borrower_id?: number | null;
  borrower_name?: string;
  borrower_contact?: string;
  purpose?: string;
  due_at?: Dayjs;
  condition_out?: string;
  condition_in?: string;
  return_target?: 'room' | 'station' | 'bench' | 'note';
  return_target_id?: number;
  location_note?: string;
}

const actionLabels: Record<DisplayAction, string> = {
  available: 'Continue', in_use: 'Assign to bench', borrowed: 'Hand over equipment',
  maintenance: 'Mark for maintenance', broken: 'Mark as broken', lost: 'Mark as lost',
  transferred: 'Transfer equipment', retired: 'Retire equipment',
};

const getSuccessMessage = (action: DisplayAction, itemName: string) => {
  const outcomes: Record<DisplayAction, string> = {
    available: 'status updated',
    in_use: 'assigned to the bench',
    borrowed: 'handed over',
    maintenance: 'marked for maintenance',
    broken: 'marked as out of service',
    lost: 'marked as lost',
    transferred: 'transfer recorded',
    retired: 'retired',
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <strong>{itemName}</strong>
      <span>{outcomes[action]} successfully.</span>
    </span>
  );
};

export function UpdateEquipmentStatusModal({
  open, record, capabilities, benchOptions, roomOptions, stationOptions, borrowerOptions, loadingOptions = false,
  onSearchBorrowers, onSearchLocations, onSave, onCancel,
}: UpdateEquipmentStatusModalProps) {
  const [form] = Form.useForm<FormValues>();
  const action = Form.useWatch('action', form);
  const returnTarget = Form.useWatch('return_target', form);
  const borrowerId = Form.useWatch('borrower_id', form);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<{ text: string; resolve: (confirmed: boolean) => void } | null>(null);
  const itemName = record.name?.trim() || record.sku || `Equipment #${record.id}`;
  const life = record.lifecycle_state?.value;
  const condition = record.condition?.value;
  const statusValue = equipmentStatusValue(record.display_status ?? record.status);
  const onBench = record.placement?.target_type?.value === 'bench';
  const onLoan = Boolean(record.loan);
  const statusFacts = useMemo(() => ({
    lifecycle: life,
    condition,
    status: statusValue,
    onBench,
    onLoan,
    calibrationOverdue: Boolean(record.is_calibration_overdue),
  }), [life, condition, statusValue, onBench, onLoan, record.is_calibration_overdue]);
  const lifecycleTargetBlocked = isLifecycleTargetBlocked(action, statusFacts);
  const borrowBlocker = firstBorrowBlocker(statusFacts, capabilities);

  const availableReason = useMemo(() => {
    if (life === 'planned' || life === 'lost' || life === 'transferred_out') return 'Return to service';
    if (life === 'retired') return undefined;
    if (condition !== 'operational') return 'Restore operational condition';
    if (onLoan) return 'Return the loan';
    if (onBench) return 'Move off the bench';
    if (record.is_calibration_overdue) return 'Calibration is overdue; record a calibration first.';
    return undefined;
  }, [condition, life, onBench, onLoan, record.is_calibration_overdue]);

  const availableActionable = life !== 'retired' && (life === 'planned' || life === 'lost' || life === 'transferred_out'
    || condition !== 'operational' || onLoan || onBench);
  const actionOptions = useMemo(() => getEquipmentStatusActionOptions(statusFacts, capabilities),
    [statusFacts, capabilities]);
  const showReturnLocation = action === 'available' && !onLoan && onBench && life === 'in_service' && condition === 'operational';
  const currentAvailableStep = getAvailableStatusStep(statusFacts);
  const location = record.placement?.bench?.name ?? record.placement?.station?.name
    ?? record.placement?.room?.name ?? record.placement?.location_note ?? 'Location unknown';
  const borrower = record.loan?.borrower_name ?? record.loan?.borrower?.name ?? 'Borrower';
  const availableButtonText = life === 'lost' ? 'Mark as found'
    : availableReason === 'Return the loan' ? 'Return loan'
    : availableReason === 'Move off the bench' ? 'Move equipment'
      : availableReason === 'Return to service' ? 'Return to service'
        : availableReason === 'Restore operational condition' ? 'Restore condition' : 'Update status';
  const submitDisabled = !action || lifecycleTargetBlocked || action === 'available' && !availableActionable
    || action === 'borrowed' && Boolean(borrowBlocker);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ transfer_date: dayjs() });
    }
  }, [form, open, record.id]);

  const submit = async () => {
    try {
      const values = await form.validateFields();
      let payload: EquipmentStatusAction | undefined;
      const makePlacement = (target: 'room' | 'station' | 'bench' | 'note', id?: number, note?: string): EquipmentPlacementWrite => ({
        ...(target !== 'note' && id ? { [`${target}_id`]: id } : {}),
        ...(target === 'note' || note?.trim() ? { location_note: note?.trim() } : {}),
        ...(target === 'bench' ? { role: 'default', position: 0 } : {}),
      });
      switch (values.action) {
        case 'maintenance': payload = { action: 'condition', body: { condition: 'in_maintenance', reason: values.reason } }; break;
        case 'broken': payload = { action: 'condition', body: { condition: 'out_of_service', reason: values.reason } }; break;
        case 'in_use': payload = { action: 'placement', body: makePlacement('bench', values.bench_id) }; break;
        case 'borrowed': payload = { action: 'hand-over', body: {
          borrower_id: values.borrower_id, borrower_name: values.borrower_name?.trim(),
          borrower_contact: values.borrower_contact?.trim(), purpose: values.purpose?.trim(),
          due_at: values.due_at?.toISOString() ?? '', condition_out: values.condition_out?.trim(),
        } }; break;
        case 'lost': payload = { action: 'lifecycle', body: { lifecycle_state: 'lost', reason: values.reason } }; break;
        case 'transferred': payload = { action: 'lifecycle', body: {
          lifecycle_state: 'transferred_out', receiving_organisation: values.receiving_organisation?.trim(),
          transfer_date: values.transfer_date?.format('YYYY-MM-DD'), reason: values.reason,
        } }; break;
        case 'retired': payload = { action: 'lifecycle', body: { lifecycle_state: 'retired', reason: values.reason } }; break;
        case 'available':
          if (life === 'lost') payload = { action: 'lifecycle', body: { lifecycle_state: 'in_service', reason: values.reason } };
          else if (life !== 'in_service') payload = { action: 'lifecycle', body: { lifecycle_state: 'in_service', reason: values.reason } };
          else if (condition !== 'operational') payload = { action: 'condition', body: { condition: 'operational', reason: values.reason } };
          else if (onLoan) payload = { action: 'return', body: {
            condition_in: values.condition_in?.trim(),
            ...(values.return_target ? values.return_target === 'note'
              ? { location_note: values.location_note?.trim() }
              : { [`${values.return_target}_id`]: values.return_target_id } : {}),
          } };
          else if (onBench) payload = values.return_target === 'note'
            ? { action: 'placement', body: { location_note: values.location_note?.trim() } }
            : values.return_target ? { action: 'placement', body: makePlacement(values.return_target, values.return_target_id, values.location_note) }
              : { action: 'clear-placement' };
          break;
      }
      if (!payload) {
        if (record.is_calibration_overdue) message.info('Record a calibration to clear the overdue status.');
        return;
      }
      if (values.action === 'available' && currentAvailableStep !== 'none') {
        setSaving(true);
        await onSave(payload);
        message.success({ content: getSuccessMessage(values.action, itemName), duration: 4 });
        onCancel();
        return;
      }
      if (['lost', 'transferred', 'retired'].includes(values.action)) {
        const confirmation = values.action === 'lost'
          ? 'Mark this item lost? Any open loan will be closed as lost, non-bench placement will be closed, reservations cancelled, and condition reset to operational.'
          : `${values.action === 'retired' ? 'Retiring is final. ' : ''}Continue with ${values.action}? Any loan must be returned and bench placement removed first. Non-bench placement will be closed, reservations cancelled, and condition reset to operational.`;
        const confirmed = await new Promise<boolean>((resolve) => setConfirmation({ text: confirmation, resolve }));
        if (!confirmed) return;
      }
      if (values.action === 'lost' || values.action === 'transferred' || values.action === 'retired') {
        setSaving(true);
        if (values.action === 'lost' && onLoan) {
          await onSave(payload);
          message.success({ content: getSuccessMessage(values.action, itemName), duration: 4 });
          onCancel();
          return;
        }
        if (values.action !== 'lost' && onLoan) {
          await onSave({ action: 'return', body: {
            ...(values.condition_in?.trim() ? { condition_in: values.condition_in.trim() } : {}),
            ...(values.return_target ? values.return_target === 'note'
              ? { location_note: values.location_note?.trim() }
              : { [`${values.return_target}_id`]: values.return_target_id } : {}),
          } });
          if (onBench) await onSave(payload);
          else {
            message.success({ content: getSuccessMessage(values.action, itemName), duration: 4 });
            onCancel();
          }
          return;
        }
        if (onBench) {
          await onSave({ action: 'placement', body: values.return_target === 'note'
            ? { location_note: values.location_note?.trim() }
            : { [`${values.return_target}_id`]: values.return_target_id } });
          await onSave(payload);
          message.success({ content: getSuccessMessage(values.action, itemName), duration: 4 });
          onCancel();
          return;
        }
        await onSave(payload);
        message.success({ content: getSuccessMessage(values.action, itemName), duration: 4 });
        onCancel();
        return;
      }
      setSaving(true);
      await onSave(payload);
      message.success({ content: getSuccessMessage(values.action, itemName), duration: 4 });
      onCancel();
    } catch (error) {
      if (!(error && typeof error === 'object' && 'errorFields' in error) && !(error instanceof Error && error.message === 'cancelled')) {
        const data = (error as { data?: { message?: string; error?: { message?: string } } })?.data;
        message.error(data?.error?.message ?? data?.message ?? 'Could not update equipment status');
      }
    } finally { setSaving(false); }
  };

  return <>
  <FormDialog
    className={styles.modal}
    title="Change equipment status"
    description="Update availability, condition or lifecycle. Review the required steps before saving."
    open={open}
    onCancel={onCancel}
    onSubmit={submit}
    submitLabel={action === 'available' ? availableButtonText : action ? actionLabels[action] : 'Update status'}
    submitDisabled={submitDisabled}
    busy={saving}
  >
    <div className={styles.summary}>
      <div className={styles.summaryMain}>
        <strong>{record.name || record.sku || `Equipment #${record.id}`}</strong>
        {record.name && record.sku && record.name !== record.sku && <span className={styles.sku}>{record.sku}</span>}
        <span className={styles.statusConnector}>is currently</span>
        <EquipmentStatus status={record.display_status ?? record.status} />
      </div>
      {(record.loan || record.placement || record.is_calibration_overdue) && <div className={styles.summaryDetails}>
        {record.loan && <span>With {borrower} · Due {dayjs(record.loan.due_at).format('D MMM YYYY, HH:mm')}{record.loan.is_overdue ? ' · Overdue' : ''}</span>}
        {record.placement && <span>{location}</span>}
        {record.is_calibration_overdue && <span className={styles.overdue}>Calibration overdue</span>}
      </div>}
    </div>
    <Form form={form} layout="vertical" className={styles.form}>
      <Form.Item name="action" label="Change status to" rules={[{ required: true, message: 'Choose a status' }]}>
        <Select placeholder="Choose a status" options={actionOptions} onChange={() => form.setFieldsValue({ return_target: undefined, return_target_id: undefined, location_note: undefined })} optionRender={(option) => <span title={option.value === 'borrowed' ? borrowBlocker : undefined}>{option.label}</span>} />
      </Form.Item>
      {action && <div className={styles.actionFields}>
        {action === 'available' && availableReason && (availableActionable || record.is_calibration_overdue) && <p className={styles.helpText} role="status">{availableActionable ? `${availableReason}. ${currentAvailableStep === 'return' ? 'The loan will be closed; check the refreshed status afterward.' : 'Check the refreshed status afterward for any remaining steps.'}` : 'Record a calibration to clear the overdue status.'}</p>}
        {action === 'available' && life === 'lost' && <Alert type="info" showIcon message="Found equipment returns in Maintenance. Record where it was found, then restore its condition to operational separately." />}
        {(action === 'lost' || action === 'transferred' || action === 'retired') && onBench && <Alert type="warning" showIcon message="This action will move the unit off its bench to the selected room, station, or location note first." />}
        {(action === 'transferred' || action === 'retired') && onLoan && <Alert type="warning" showIcon message="The open loan will be returned before this status change." />}
        {action === 'retired' && !lifecycleTargetBlocked && <p className={styles.warningText}>Retirement is final. You will be asked to confirm.</p>}
        {(action === 'maintenance' || action === 'broken' || action === 'lost' || action === 'retired' || action === 'transferred' || action === 'available' && (life !== 'in_service' || condition !== 'operational')) && <Form.Item name="reason" label={life === 'lost' && action === 'available' ? 'Where was it found? (optional)' : 'Reason (optional)'} rules={[{ max: 500 }]}><Input.TextArea rows={3} maxLength={500} showCount placeholder="Add context for this change" /></Form.Item>}
        {action === 'transferred' && <div className={styles.fieldGrid}>
          <Form.Item name="receiving_organisation" label="Receiving organisation" rules={[{ required: true, whitespace: true, message: 'Enter a receiving organisation' }]}><Input maxLength={255} placeholder="Organisation name" /></Form.Item>
          <Form.Item name="transfer_date" label="Transfer date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
        </div>}
        {action === 'in_use' && <Form.Item name="bench_id" label="Assign to bench" rules={[{ required: true, message: 'Select a bench' }]}><Select showSearch optionFilterProp="label" placeholder="Search for a bench" options={benchOptions.map(({ id, name, sku }) => ({ value: id, label: sku ? `${sku} — ${name}` : name }))} loading={loadingOptions} /></Form.Item>}
        {action === 'borrowed' && <>
          {borrowBlocker && <Alert type="warning" showIcon message={borrowBlocker} />}
          <div className={styles.fieldGrid}>
            <Form.Item name="borrower_id" label="Account borrower" extra="Choose an account or enter a borrower name."><Select allowClear showSearch filterOption={false} onSearch={onSearchBorrowers} placeholder="Search accounts (optional)" options={borrowerOptions.map(({ id, name }) => ({ value: id, label: name }))} loading={loadingOptions} /></Form.Item>
            <Form.Item name="borrower_name" label="Borrower name" rules={[{ required: borrowerId == null, whitespace: true, message: 'Enter a borrower name' }]}><Input placeholder="Full name" /></Form.Item>
            <Form.Item name="borrower_contact" label="Contact"><Input placeholder="Email or phone (optional)" /></Form.Item>
            <Form.Item name="due_at" label="Due date and time" rules={[{ required: true, validator: (_, value: Dayjs | undefined) => value?.isAfter(dayjs()) ? Promise.resolve() : Promise.reject(new Error('Choose a future due date')) }]}><DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
          </div>
          <Form.Item name="purpose" label="Purpose"><Input.TextArea rows={2} placeholder="Reason for borrowing (optional)" /></Form.Item>
          <Form.Item name="condition_out" label="Condition at hand-over"><Input placeholder="Notes about its condition (optional)" /></Form.Item>
        </>}
        {(action === 'available' && onLoan || (action === 'lost' || action === 'transferred' || action === 'retired') && onLoan) && <Form.Item name="condition_in" label="Condition at return"><Input placeholder="Notes about its condition (optional)" /></Form.Item>}
        {(action === 'transferred' || action === 'retired') && onLoan && !onBench && <div className={styles.fieldGrid}>
          <Form.Item name="return_target" label="Return to" rules={[{ required: true, message: 'Choose where the returned equipment will be kept' }]}><Select showSearch filterOption={false} onSearch={onSearchLocations} placeholder="Choose a location" options={[{ value: 'room', label: 'Room' }, { value: 'station', label: 'Station' }, { value: 'note', label: 'Location note' }]} /></Form.Item>
          {returnTarget === 'note' && <Form.Item name="location_note" label="Location note" rules={[{ required: true, whitespace: true }]}><Input placeholder="Describe where it will be kept" /></Form.Item>}
          {returnTarget && returnTarget !== 'note' && <Form.Item name="return_target_id" label={`Select ${returnTarget}`} rules={[{ required: true }]}><Select showSearch filterOption={false} onSearch={onSearchLocations} options={(returnTarget === 'room' ? roomOptions : stationOptions).map(({ id, name, sku }) => ({ value: id, label: sku ? `${sku} — ${name}` : name }))} loading={loadingOptions} placeholder="Search for a location" /></Form.Item>}
        </div>}
        {(action === 'lost' || action === 'transferred' || action === 'retired') && onBench && <div className={styles.fieldGrid}>
          <Form.Item name="return_target" label="Move to" rules={[{ required: true, message: 'Choose a destination before moving off the bench' }]}><Select showSearch filterOption={false} onSearch={onSearchLocations} placeholder="Choose a destination" options={[{ value: 'room', label: 'Room' }, { value: 'station', label: 'Station' }, { value: 'note', label: 'Location note' }]} /></Form.Item>
          {returnTarget === 'note' && <Form.Item name="location_note" label="Location note" rules={[{ required: true, whitespace: true }]}><Input placeholder="Describe where it will be kept" /></Form.Item>}
          {returnTarget && returnTarget !== 'note' && <Form.Item name="return_target_id" label={`Select ${returnTarget}`} rules={[{ required: true }]}><Select showSearch filterOption={false} onSearch={onSearchLocations} options={(returnTarget === 'room' ? roomOptions : stationOptions).map(({ id, name, sku }) => ({ value: id, label: sku ? `${sku} — ${name}` : name }))} loading={loadingOptions} placeholder="Search for a location" /></Form.Item>}
        </div>}
        {showReturnLocation && <div className={styles.fieldGrid}>
          <Form.Item name="return_target" label="Move to" extra="Leave empty to clear the current placement."><Select allowClear placeholder="Choose a location type" options={[{ value: 'room', label: 'Room' }, { value: 'station', label: 'Station' }, { value: 'note', label: 'Location note' }]} /></Form.Item>
          {returnTarget === 'note' && <Form.Item name="location_note" label="Location note" rules={[{ required: true, whitespace: true }]}><Input placeholder="Describe where it will be kept" /></Form.Item>}
          {returnTarget && returnTarget !== 'note' && <Form.Item name="return_target_id" label={`Select ${returnTarget}`} rules={[{ required: true }]}><Select showSearch filterOption={false} onSearch={onSearchLocations} options={(returnTarget === 'bench' ? benchOptions : returnTarget === 'room' ? roomOptions : stationOptions).map(({ id, name, sku }) => ({ value: id, label: sku ? `${sku} — ${name}` : name }))} loading={loadingOptions} placeholder="Search for a location" /></Form.Item>}
        </div>}
      </div>}
    </Form>
  </FormDialog>
  <FormDialog open={confirmation !== null} title="Confirm status change" description="Review the consequences of this change." submitLabel="Confirm change" destructive
    onCancel={() => { confirmation?.resolve(false); setConfirmation(null); }}
    onSubmit={() => { confirmation?.resolve(true); setConfirmation(null); }}>
    <p className="tw:text-sm tw:leading-relaxed">{confirmation?.text}</p>
  </FormDialog>
  </>;
}
