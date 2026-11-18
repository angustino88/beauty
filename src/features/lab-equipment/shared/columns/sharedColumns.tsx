import { PersonIcon } from '@/components/display/PersonIcon';
/**
 * Shared column renderers and helpers for equipment tables.
 * Eliminates duplication of audit, image, status, info, and action columns.
 */
/* eslint-disable react-refresh/only-export-components */
import { Button, Dropdown, Image, Popconfirm, Popover, Space, Tag, Tooltip, Upload } from 'antd';
import type { MenuProps } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, EditOutlined, HistoryOutlined, LoadingOutlined, MoreOutlined, PlusOutlined, PrinterOutlined } from '@ant-design/icons';
import { useState, type ReactNode } from 'react';
import { useLabsResourcesAuditsRetrieveByResourceTypeResourceIdQuery } from '@/shared/api/generated/api';
import dayjs from 'dayjs';
import EquipmentStatus from '../components/status/EquipmentStatus';
import { readStatusFromRecord, buildEquipmentInfo } from '../utils/parity';
import type { ILabAudit, IPrimaryOwner } from '../types/equipment.types';
import { userLabel } from '@/shared/utils/userRef';



/**
 * Last audit of one resource. The resource payload no longer carries it, so it is read from the
 * resource's audit history (newest first, one row); the request cache absorbs repeat renders.
 */
export function LastAuditCell({ resourceType, resourceId }: {
  resourceType: 'room' | 'license' | 'equipment' | 'bench' | 'station';
  resourceId: number;
}) {
  const { data, isLoading } = useLabsResourcesAuditsRetrieveByResourceTypeResourceIdQuery({
    resourceType,
    resourceId: String(resourceId),
    pageSize: 1,
  });
  if (isLoading) return <LoadingOutlined />;
  const latest = data?.data?.[0];
  if (!latest) return '—';
  return renderAuditCell({
    audit_id: String(latest.id),
    auditor: userLabel(latest.auditor) || null,
    audited_at: latest.audited_at,
    audit_status: latest.result?.value ?? null,
    remarks: latest.remarks || null,
  });
}

/** Renders last audited cell with status tag and details tooltip */
export function renderAuditCell(audit: ILabAudit | null | undefined) {
  if (!audit?.audited_at) return '—';
  const isApproved = ['ok', 'pass'].includes(audit.audit_status?.toLowerCase() ?? '');
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

/**
 * Renders image cell with popover preview. A resource without an image shows `fallback`, the symbol of the page it
 * lives on (see `resourcePageIcon`).
 */
export function renderImageCell(value: string | null | undefined, fallback: ReactNode) {
  if (!value) {
    return (
      <span
        role="img"
        aria-label="No image"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40,
          borderRadius: 6, background: 'var(--lm-surface-muted)', color: 'var(--lm-text-secondary)', fontSize: 18,
        }}
      >
        {fallback}
      </span>
    );
  }
  return (
    <Popover content={<Image width={220} src={value} />} placement="right">
      <Image width={40} height={40} src={value} preview={false} />
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
  const label = owner.username || owner.display_name;
  if (!label) return '—';
  return (
    <Tooltip title={owner.display_name || owner.username}>
    <Tag
      style={{
        color: 'var(--lm-text-secondary)',
        background: 'var(--lm-surface-muted)',
        border: 'none',
        borderRadius: 14,
        fontWeight: 500,
      }}
    >
      <PersonIcon />{label}
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
    // Name the row in every action, so the tooltip and screen reader say which item it affects.
    const named = record as TRecord & { sku?: string | null; name?: string | null };
    const label = named.sku || named.name || `#${record.id}`;
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
        label: 'Print label',
        icon: <PrinterOutlined />,
        onClick: () => onPrint(record),
      });
    }
    menuItems.push(...(options.extraMenuItems?.(record) ?? []));

    return (
      <Space size={4} onClick={(event) => event.stopPropagation()}>
        <Tooltip title={`Edit ${label}`}>
          <Button
            aria-label={`Edit ${label}`}
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
            title={options.deleteConfirmText ?? `Delete ${label}?`}
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            placement="topRight"
            onConfirm={() => options.onDelete(record.id)}
          >
            <Tooltip title={`Delete ${label}`}>
              <Button
                aria-label={`Delete ${label}`}
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
          <Tooltip title={`More actions for ${label}`}>
            <Button aria-label={`More actions for ${label}`} size="small" icon={<MoreOutlined />} />
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
