import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Descriptions, Modal, Space, Tag, Typography } from 'antd';
import {
  ExclamationCircleOutlined,
  LinkOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  extractBlockerSearchToken,
  parseBlockedDeleteError,
  type BlockedDeleteGroup,
  type ParsedBlockedDeleteError,
} from '../../utils/deleteBlockers';

export type GuardedDeleteResourceKind = 'room' | 'station' | 'bench' | 'license';

export interface GuardedDeleteTarget {
  id: number;
  sku?: string | null;
  name?: string | null;
}

export interface GuardedDeleteAttemptResult {
  ok: boolean;
  error?: unknown;
}

export interface GuardedDeleteModalProps {
  open: boolean;
  resourceKind: GuardedDeleteResourceKind;
  item: GuardedDeleteTarget | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: (id: number) => Promise<GuardedDeleteAttemptResult>;
}

const RESOURCE_COPY: Record<
  GuardedDeleteResourceKind,
  { singular: string; preconditionHint: string }
> = {
  room: {
    singular: 'Room',
    preconditionHint:
      'Rooms cannot be deleted while stations or resting equipment are still placed inside. If you want to stop using this room without removing it, consider retiring it via Change lifecycle instead.',
  },
  station: {
    singular: 'Station',
    preconditionHint:
      'Stations cannot be deleted while configured benches or resting equipment are still placed here. If you want to stop using this station without removing it, consider retiring it via Change lifecycle instead.',
  },
  bench: {
    singular: 'Bench',
    preconditionHint:
      'Benches cannot be deleted while equipment is assigned or active bookings exist. Move equipment and cancel active bookings first, or retire the bench via Change lifecycle.',
  },
  license: {
    singular: 'License',
    preconditionHint:
      'Licenses cannot be deleted while seats are still assigned to equipment. Unassign the license from all equipment first.',
  },
};

interface BlockerGroupMeta {
  title: string;
  actionLabel: string;
  actionPath: string;
  itemLinkBuilder?: (label: string) => string;
}

function getBlockerGroupMeta(
  resourceKind: GuardedDeleteResourceKind,
  groupKey: string,
): BlockerGroupMeta {
  switch (groupKey) {
    case 'stations':
      return {
        title: 'Stations in this room',
        actionLabel: 'Open Stations',
        actionPath: '/spaces/station',
        itemLinkBuilder: (label) =>
          `/spaces/station?q=${encodeURIComponent(extractBlockerSearchToken(label))}`,
      };
    case 'benches':
      return {
        title: 'Configured benches on this station',
        actionLabel: 'Open Benches',
        actionPath: '/spaces/bench',
        itemLinkBuilder: (label) =>
          `/spaces/bench?q=${encodeURIComponent(extractBlockerSearchToken(label))}`,
      };
    case 'bookings':
      return {
        title: 'Active bench bookings',
        actionLabel: 'Open Booking Calendar',
        actionPath: '/booking-calendar',
      };
    case 'equipment':
      if (resourceKind === 'license') {
        return {
          title: 'Equipment holding seats of this license',
          actionLabel: 'Open Space Mapping',
          actionPath: '/spaces/mapping',
        };
      }
      return {
        title:
          resourceKind === 'bench'
            ? 'Equipment assigned to this bench'
            : resourceKind === 'station'
              ? 'Equipment kept at this station'
              : 'Equipment kept in this room',
        actionLabel: 'Open Space Mapping',
        actionPath: '/spaces/mapping',
      };
    default:
      return {
        title: groupKey,
        actionLabel: 'Open Space Mapping',
        actionPath: '/spaces/mapping',
      };
  }
}

export const GuardedDeleteModal: React.FC<GuardedDeleteModalProps> = ({
  open,
  resourceKind,
  item,
  deleting,
  onCancel,
  onConfirm,
}) => {
  const navigate = useNavigate();
  const [conflict, setConflict] = useState<ParsedBlockedDeleteError | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!item) return null;

  const copy = RESOURCE_COPY[resourceKind];
  const displayLabel = item.sku || item.name || `${copy.singular} #${item.id}`;

  const handleConfirm = async () => {
    setErrorMessage(null);
    const result = await onConfirm(item.id);
    if (result.ok) {
      onCancel();
      return;
    }
    const parsed = parseBlockedDeleteError(
      result.error,
      `Failed to delete ${copy.singular.toLowerCase()}.`,
    );
    if (parsed.isConflict) {
      setConflict(parsed);
    } else {
      setConflict(null);
      setErrorMessage(parsed.message);
    }
  };

  const handleNavigate = (path: string) => {
    onCancel();
    void navigate(path);
  };

  const renderGroup = (group: BlockedDeleteGroup) => {
    const meta = getBlockerGroupMeta(resourceKind, group.key);
    const remaining = Math.max(0, group.total - group.items.length);

    return (
      <div
        key={group.key}
        style={{
          border: '1px solid var(--lm-border-subtle, #f0f0f0)',
          borderRadius: 8,
          padding: '10px 12px',
          background: 'var(--lm-surface-subtle, #fafafa)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: group.items.length > 0 ? 8 : 0,
          }}
        >
          <Space size={8}>
            <Typography.Text strong>{meta.title}</Typography.Text>
            <Tag color="orange" style={{ marginInlineEnd: 0 }}>
              {group.total}
            </Tag>
          </Space>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            style={{ paddingInline: 0 }}
            onClick={() => handleNavigate(meta.actionPath)}
          >
            {meta.actionLabel}
          </Button>
        </div>

        {group.items.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {group.items.map((label) => {
              const targetPath = meta.itemLinkBuilder?.(label);
              return (
                <li key={label} style={{ marginBottom: 2 }}>
                  {targetPath ? (
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, height: 'auto' }}
                      onClick={() => handleNavigate(targetPath)}
                    >
                      {label}
                    </Button>
                  ) : (
                    <Typography.Text>{label}</Typography.Text>
                  )}
                </li>
              );
            })}
            {remaining > 0 && (
              <li>
                <Typography.Text type="secondary">
                  …and {remaining} more
                </Typography.Text>
              </li>
            )}
          </ul>
        )}
      </div>
    );
  };

  const isBlocked = conflict !== null;

  return (
    <Modal
      open={open}
      onCancel={deleting ? undefined : onCancel}
      maskClosable={!deleting}
      closable={!deleting}
      destroyOnHidden
      width={isBlocked ? 560 : 480}
      title={
        <Space size={8}>
          {isBlocked ? (
            <StopOutlined style={{ color: 'var(--lm-warning-solid, #faad14)' }} />
          ) : (
            <ExclamationCircleOutlined style={{ color: 'var(--lm-warning-solid, #faad14)' }} />
          )}
          <span>
            {isBlocked ? `Cannot delete ${displayLabel}` : `Delete ${displayLabel}?`}
          </span>
        </Space>
      }
      footer={
        <Space>
          <Button onClick={onCancel} disabled={deleting}>
            {isBlocked ? 'Close' : 'Cancel'}
          </Button>
          {isBlocked ? (
            <Button type="primary" loading={deleting} onClick={() => void handleConfirm()}>
              Try again
            </Button>
          ) : (
            <Button type="primary" danger loading={deleting} onClick={() => void handleConfirm()}>
              Delete
            </Button>
          )}
        </Space>
      }
    >
      <Space orientation="vertical" size={14} style={{ width: '100%' }}>
        <Descriptions size="small" column={2} bordered>
          <Descriptions.Item label="SKU">
            <Typography.Text code>{item.sku || '—'}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="ID">#{item.id}</Descriptions.Item>
          <Descriptions.Item label="Name" span={2}>
            {item.name || '—'}
          </Descriptions.Item>
        </Descriptions>

        {!isBlocked ? (
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {copy.preconditionHint}
          </Typography.Paragraph>
        ) : (
          <>
            <Alert
              type="warning"
              showIcon
              title="Resolve linked items before deleting"
              description={conflict.message}
            />
            {conflict.groups.length > 0 && (
              <Space orientation="vertical" size={10} style={{ width: '100%' }}>
                {conflict.groups.map(renderGroup)}
              </Space>
            )}
            {conflict.groups.length === 0 && (
              <Space wrap>
                {resourceKind === 'room' && (
                  <Button size="small" icon={<LinkOutlined />} onClick={() => handleNavigate('/spaces/station')}>
                    Open Stations
                  </Button>
                )}
                {resourceKind === 'station' && (
                  <Button size="small" icon={<LinkOutlined />} onClick={() => handleNavigate('/spaces/bench')}>
                    Open Benches
                  </Button>
                )}
                {resourceKind === 'bench' && (
                  <Button size="small" icon={<LinkOutlined />} onClick={() => handleNavigate('/booking-calendar')}>
                    Open Booking Calendar
                  </Button>
                )}
                <Button size="small" icon={<LinkOutlined />} onClick={() => handleNavigate('/spaces/mapping')}>
                  Open Space Mapping
                </Button>
              </Space>
            )}
          </>
        )}

        {errorMessage && <Alert type="error" showIcon title={errorMessage} />}
      </Space>
    </Modal>
  );
};

export default GuardedDeleteModal;
