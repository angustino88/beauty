/**
 * Shared column renderers and helpers for equipment tables.
 * Eliminates duplication of audit, image, status, info, and action columns.
 */
/* eslint-disable react-refresh/only-export-components */
import { Button, Dropdown, Image, Popconfirm, Popover, Space, Tag, Tooltip, Upload } from 'antd';
import type { MenuProps } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, EditOutlined, HistoryOutlined, LoadingOutlined, MoreOutlined, PlusOutlined, PrinterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';
import EquipmentStatus from '../components/status/EquipmentStatus';
import { readStatusFromRecord, buildEquipmentInfo } from '../utils/parity';
import type { ILabAudit, IPrimaryOwner } from '../types/equipment.types';


const DEFAULT_IMAGE = "data:image/png;base64,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";
export { DEFAULT_IMAGE };

/** Renders last audited cell with status tag and details tooltip */
export function renderAuditCell(audit: ILabAudit | null | undefined) {
  if (!audit?.audited_at) return '—';
  const isApproved = audit.audit_status?.toLowerCase() === 'ok';
  const label = dayjs(audit.audited_at).format('MMM D, YYYY');
  const details = [
    { label: 'Audit ID', value: audit.audit_id || '—' },
    { label: 'Auditor', value: audit.auditor || '—' },
    { label: 'Audited at', value: dayjs(audit.audited_at).format('MMM D, YYYY, h:mm A') },
    { label: 'Remarks', value: audit.remarks || 'No remarks' },
  ];

  return (
    <Popover
      placement="top"
      title={(
        <Space size={8}>
          {isApproved ? (
            <CheckCircleOutlined style={{ color: 'var(--lm-success-fg)' }} />
          ) : (
            <CloseCircleOutlined style={{ color: 'var(--lm-danger-fg)' }} />
          )}
          <strong>Audit details</strong>
          <Tag color={isApproved ? 'success' : 'error'} style={{ marginInlineEnd: 0 }}>
            {audit.audit_status || 'Unknown'}
          </Tag>
        </Space>
      )}
      content={(
        <div style={{ minWidth: 260, maxWidth: 360 }}>
          {details.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px minmax(0, 1fr)',
                gap: 12,
                padding: '5px 0',
              }}
            >
              <span style={{ color: 'var(--lm-text-tertiary)', fontSize: 12 }}>{item.label}</span>
              <span style={{ color: 'var(--lm-text)', fontWeight: 500, overflowWrap: 'anywhere' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    >
      <Tag
        icon={isApproved ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        style={{
          color: isApproved ? 'var(--lm-success-fg)' : 'var(--lm-danger-fg)',
          background: isApproved ? 'var(--lm-success-bg)' : 'var(--lm-danger-bg)',
          border: 'none',
          borderRadius: 14,
          fontWeight: 500,
        }}
      >
        {label}
      </Tag>
    </Popover>
  );
}

/** Renders image cell with popover preview */
export function renderImageCell(value: string | null | undefined) {
  const src = value || DEFAULT_IMAGE;
  const content = value ? <Image width={220} src={src} /> : <div>No image available</div>;
  return (
    <Popover content={content} placement="right">
      <Image width={40} height={40} src={src} preview={false} />
    </Popover>
  );
}

/** Renders editable image cell (upload in inline edit mode) */
export function InlineImageUpload({ currentImage, onImageChange }: { currentImage?: string | null; onImageChange: (file: File) => void }) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [loading, setLoading] = useState(false);

  return (
    <Upload
      accept="image/*"
      listType="picture-card"
      maxCount={1}
      showUploadList={false}
      beforeUpload={(file) => {
        setLoading(true);
        onImageChange(file);
        setPreview(URL.createObjectURL(file));
        setLoading(false);
        return false;
      }}
    >
      {preview ? (
        <Image src={preview} style={{ width: '100%' }} preview={false} />
      ) : (
        <div style={{ border: 0, background: 'none' }}>
          {loading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      )}
    </Upload>
  );
}

/** Renders status tag */
export function renderStatusCell(record: unknown) {
  return <EquipmentStatus status={readStatusFromRecord(record)} />;
}

/** Renders information cell based on status */
export function renderInfoCell(record: unknown) {
  return <span style={{ whiteSpace: 'pre-line' }}>{buildEquipmentInfo(record)}</span>;
}

/** Renders primary owner with tooltip */
export function renderOwnerCell(owner: IPrimaryOwner | null | undefined) {
  if (!owner) return '—';
  return (
    <Tooltip title={owner.display_name}>
    <Tag
      style={{
        color: 'var(--lm-primary)',
        background: 'var(--lm-info-bg)',
        border: 'none',
        borderRadius: 14,
        fontWeight: 500,
      }}
    >
      👤 {owner.username}
    </Tag>
    </Tooltip>
  );
}

/** Renders license tags (sku column) */
export function renderLicenseSku(licenses: Array<{ id: number; sku?: string | null }> | null | undefined) {
  if (!licenses?.length) return '';
  return (
    <Space wrap size={[4, 4]}>
      {licenses.map((item) => item.sku ? <Tag key={`sku-${item.id}`}>{item.sku}</Tag> : null)}
    </Space>
  );
}

/** Renders license tags (name column) */
export function renderLicenseName(licenses: Array<{ id: number; name?: string | null; license_name?: string | null }> | null | undefined) {
  if (!licenses?.length) return '';
  return (
    <Space wrap size={[4, 4]}>
      {licenses.map((item) => {
        const label = item.name ?? item.license_name;
        return label ? <Tag key={`name-${item.id}`}>{label}</Tag> : null;
      })}
    </Space>
  );
}

/** Standard actions column renderer */
export function createActionsRenderer<TRecord extends { id: number }>(options: {
  isAdmin: boolean;
  deleting: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onHistory?: (id: number, record?: TRecord) => void;
  onPrint?: (record: TRecord) => void;
  deleteConfirmText?: string;
  extraMenuItems?: (record: TRecord) => Array<{ key: string; label: string; onClick: () => void }>;
}) {
  return (_: unknown, record: TRecord) => {
    const menuItems: NonNullable<MenuProps['items']> = [];
    if (options.onHistory) {
      const onHistory = options.onHistory;
      menuItems.push({
        key: 'history',
        label: 'View status history',
        icon: <HistoryOutlined />,
        onClick: () => onHistory(record.id, record),
      });
    }
    if (options.onPrint) {
      const onPrint = options.onPrint;
      menuItems.push({
        key: 'print',
        label: 'Print equipment label',
        icon: <PrinterOutlined />,
        onClick: () => onPrint(record),
      });
    }
    menuItems.push(...(options.extraMenuItems?.(record) ?? []));

    return (
      <Space size={4} onClick={(event) => event.stopPropagation()}>
        <Tooltip title="Edit record">
          <Button
            aria-label="Edit record"
            size="small"
            icon={<EditOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              options.onEdit(record.id);
            }}
          />
        </Tooltip>
        {options.isAdmin && (
          <Popconfirm
            title={options.deleteConfirmText ?? 'Delete this item?'}
            placement="topRight"
            onConfirm={() => options.onDelete(record.id)}
          >
            <Tooltip title="Delete record">
              <Button
                aria-label="Delete record"
                size="small"
                icon={<DeleteOutlined />}
                danger
                loading={options.deleting}
                onClick={(event) => event.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        )}
        <Dropdown
          placement="bottomRight"
          menu={{
            items: menuItems,
            selectable: false,
            onClick: ({ domEvent }) => domEvent.stopPropagation(),
          }}
        >
          <Tooltip title="More actions">
            <Button aria-label="More actions" size="small" icon={<MoreOutlined />} />
          </Tooltip>
        </Dropdown>
      </Space>
    );
  };
}

/** Builds filter options from entity reference lists (e.g. classes, manufacturers) */
export function toEntityFilters<T extends { id: number }>(
  items: T[] | undefined,
  readLabel: (item: T) => string | undefined,
) {
  return (items ?? [])
    .map((item) => {
      const label = readLabel(item);
      return label ? { text: label, value: String(item.id) } : null;
    })
    .filter((item): item is { text: string; value: string } => item !== null);
}

/** Builds filter options from row field values */
export function toRowFilters(values: Array<string | number | null | undefined>) {
  return Array.from(new Set(values.filter((v): v is string | number => v != null && v !== '')))
    .map((v) => ({ text: String(v), value: String(v) }));
}
