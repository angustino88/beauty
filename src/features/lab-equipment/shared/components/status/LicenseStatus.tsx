/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Button, Form, Input, Modal, Select } from 'antd';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { licenseStatusLabel, licenseStatusTone, licenseStatusValue } from '../../../license/licenseStatus';

// The states the API records (`POST /licenses/{id}/actions/change-status`).
const LICENSE_STATUS_META: Record<string, { label: string; bgColor: string; textColor: string }> = {
  available: { label: 'Available', bgColor: '#41765b', textColor: '#ffffff' },
  assigned: { label: 'Assigned', bgColor: '#176b87', textColor: '#ffffff' },
  expired: { label: 'Expired', bgColor: '#bd6b3d', textColor: '#ffffff' },
  revoked: { label: 'Revoked', bgColor: '#9d4148', textColor: '#ffffff' },
  suspended: { label: 'Suspended', bgColor: '#b17a2c', textColor: '#ffffff' },
};

export { LICENSE_STATUS_META };

export const LICENSE_STATUS_OPTIONS = Object.entries(LICENSE_STATUS_META).map(([value, { label }]) => ({
  label,
  value,
}));

/* ─── Update License Status Modal ─────────────────────────── */

interface UpdateLicenseStatusModalProps {
  open: boolean;
  record: { id: number; sku?: string; status?: string | null };
  onCancel: () => void;
  onSave: (values: { status_type: string; status_data: Record<string, unknown> }) => void;
}

export function UpdateLicenseStatusModal({ open, record, onCancel, onSave }: UpdateLicenseStatusModalProps) {
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch {
      // validation errors shown in UI
    }
  };

  return (
    <Modal
      width={560}
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      title={`Update status for ${record.sku ?? ''}`}
      style={{ top: '10%' }}
      destroyOnHidden
    >
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status_type: record.status || '',
            status_data: { notes: '' },
          }}
        >
          <Form.Item
            name="status_type"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select placeholder="Select Status" options={LICENSE_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name={['status_data', 'notes']} label="Notes">
            <Input.TextArea placeholder="Enter Notes" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}

/* ─── LicenseStatus component ──────────────────────────────── */

interface Props {
  status?: string;
  isEditing?: boolean;
  record?: { id: number; sku?: string; status?: string | null };
  onStatusChange?: (values: { status_type: string; status_data: Record<string, unknown> }) => void;
}

export default function LicenseStatus({ status, isEditing, record, onStatusChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const normalized = licenseStatusValue(status);
  const meta = LICENSE_STATUS_META[normalized];
  const tone = licenseStatusTone(normalized);

  if (isEditing && record) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          {meta?.label ?? licenseStatusLabel(status)}
        </Button>
        {isOpen && (
          <UpdateLicenseStatusModal
            open={isOpen}
            record={record}
            onCancel={() => setIsOpen(false)}
            onSave={(values) => {
              onStatusChange?.(values);
              setIsOpen(false);
            }}
          />
        )}
      </>
    );
  }

  return (
    <StatusBadge tone={tone} label={meta?.label ?? licenseStatusLabel(status)} />
  );
}
