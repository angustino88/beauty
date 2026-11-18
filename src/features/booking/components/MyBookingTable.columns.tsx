import { PersonIcon } from '@/components/display/PersonIcon';
/* eslint-disable react-refresh/only-export-components */
import {
  EditOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  QuestionCircleOutlined } from '@ant-design/icons';
import { Space, Switch, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { TooltipButton } from '@/components/layout/TooltipButton';
import type { BenchBookingItem, IProjectOption } from '../types';
import styles from './MyBookingTable.module.css';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { StatusTone } from '@/shared/status/statusTone';

const statusToneMap: Record<string, StatusTone> = {
  reserved: 'reserved',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'neutral',
  expired: 'danger',
  // Fallbacks for any legacy records
  available: 'reserved',
  'in-progress': 'info',
  done: 'success',
  cancel: 'neutral',
};

const titleMap: Record<string, string> = {
  reserved: 'Reserved',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  // Fallbacks for any legacy records
  available: 'Reserved',
  'in-progress': 'In progress',
  done: 'Completed',
  cancel: 'Cancelled',
};

const approvalToneMap: Record<string, StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const approvalTitleMap: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const approvalIconMap: Record<string, React.ReactNode> = {
  pending: <ClockCircleFilled />,
  approved: <CheckCircleFilled />,
  rejected: <CloseCircleFilled />,
};

const StatusIndicator = ({ status }: { status: string }) => (
  <StatusBadge tone={statusToneMap[status] ?? 'neutral'} label={titleMap[status] || status || 'Unknown'} />
);

const ApprovalIndicator = ({ status }: { status: string }) => (
  <StatusBadge
    tone={approvalToneMap[status] ?? 'neutral'}
    icon={approvalIconMap[status] ?? <QuestionCircleOutlined />}
    label={approvalTitleMap[status] || status || 'Unknown'}
  />
);

const DateRenderer = React.memo(({ value }: { value: string | undefined }) => {
  if (!value) return <Typography.Text type="secondary">—</Typography.Text>;

  const date = dayjs(value);
  return (
    <Tooltip title={date.format('YYYY-MM-DD hh:mm A')} placement="topLeft">
      <div style={{ minWidth: 0, lineHeight: 1.35, textAlign: 'left' }}>
        <Typography.Text style={{ display: 'block', color: 'var(--lm-text)', fontWeight: 500, fontSize: 12 }}>
          {date.format('MMM D, YYYY')}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
          {date.format('h:mm A')}
        </Typography.Text>
      </div>
    </Tooltip>
  );
});

export interface BuildMyBookingColumnsParams {
  filterParams: {
    status?: string[];
    approval_status?: string[];
    project_id?: (string | number)[];
    project?: (string | number)[];
  };
  projects?: IProjectOption[];
  permissionGroups: Record<string, unknown>;
  isCoordinator: boolean;
  showAll: boolean;
  onToggleShowAll: (value: boolean) => void;
  onEditBooking: (bookingId: number) => void;
  onApproveBooking: (bookingId: number) => void;
  onRejectBooking: (bookingId: number) => void;
}

export function buildMyBookingColumns({
  filterParams,
  projects,
  permissionGroups,
  isCoordinator,
  showAll,
  onToggleShowAll,
  onEditBooking,
  onApproveBooking,
  onRejectBooking,
}: BuildMyBookingColumnsParams): ColumnsType<BenchBookingItem> {
  const projectList = projects ?? [];

  return [
    { title: 'ID', dataIndex: 'id', key: 'id', align: 'left', width: 72 },
    {
      dataIndex: 'status',
      key: 'status',
      title: 'Status',
      align: 'left',
      width: 136,
      filters: [
        { text: 'Reserved', value: 'reserved' },
        { text: 'In progress', value: 'in_progress' },
        { text: 'Completed', value: 'completed' },
        { text: 'Cancelled', value: 'cancelled' },
        { text: 'Expired', value: 'expired' },
      ],
      filterSearch: true,
      filterMultiple: true,
      filteredValue: filterParams?.status || [],
      filterOnClose: false,
      render: (status: string) => <StatusIndicator status={status} />,
    },
    {
      dataIndex: 'approval_status',
      key: 'approval_status',
      title: 'Approval',
      align: 'left',
      width: 136,
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' },
      ],
      filterSearch: true,
      filterMultiple: true,
      filteredValue: filterParams?.approval_status || [],
      filterOnClose: false,
      render: (approvalStatus: string, record: BenchBookingItem) => {
        const getTooltipTitle = () => {
          if (approvalStatus === 'pending') return null;
          const approvalBy = record.approval_by;
          const actionText = approvalStatus === 'approved' ? 'Approved' : 'Rejected';
          if (!approvalBy) return `${actionText} by System`;
          return (
            <span>
              {actionText} by <strong>{approvalBy.username.toUpperCase()}</strong> {approvalBy.display_name}
            </span>
          );
        };

        const tooltipTitle = getTooltipTitle();
        const indicator = <ApprovalIndicator status={approvalStatus} />;

        return tooltipTitle
          ? <Tooltip title={tooltipTitle}><span className={styles.tooltipTarget}>{indicator}</span></Tooltip>
          : indicator;
      },
    },
    {
      title: isCoordinator ? (
        <Space align="center" size={4}>
          <Typography.Text style={{ fontSize: 'inherit', color: 'inherit' }}>Creator</Typography.Text>
          <Space size={6}>
            <Tooltip title="Show bookings from every creator">
              <span
                className={styles.creatorSwitch}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Switch
                  size="small"
                  checked={showAll}
                  onClick={(_, event) => event.stopPropagation()}
                  onChange={onToggleShowAll}
                />
              </span>
            </Tooltip>
          </Space>
        </Space>
      ) : 'Creator',
      dataIndex: 'creator',
      key: 'creator',
      align: 'left',
      width: 160,
      ellipsis: { showTitle: false },
      render: (_: unknown, record: BenchBookingItem) => {
        const creator = record.creator;
        if (!creator) return <Typography.Text type="secondary">—</Typography.Text>;
        const username =
          typeof creator === 'string'
            ? creator
            : creator.username || creator.display_name;

        if (!username || username.trim() === '' || username === '—') {
          return <Typography.Text type="secondary">—</Typography.Text>;
        }

        const displayName =
          typeof creator === 'object' && creator.display_name
            ? creator.display_name
            : username;

        return (
          <Tooltip title={displayName !== username ? displayName : null} placement="right">
            <Tag
              style={{
                color: 'var(--lm-text-secondary)',
                background: 'var(--lm-surface-muted)',
                border: 'none',
                borderRadius: 14,
                fontWeight: 500,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <PersonIcon />{username}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Bench',
      key: 'bench',
      align: 'left',
      width: 190,
      render: (_: unknown, record: BenchBookingItem) => {
        const benchName = record.bench?.name || '—';
        const benchSku = record.bench?.sku;
        const computerName = record.computer?.computer_name;
        const subText = [benchSku, computerName].filter(Boolean).join(' · ') || 'No computer assigned';

        return (
          <div style={{ width: '100%', minWidth: 0, textAlign: 'left' }}>
            <Typography.Text strong ellipsis style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>
              {benchName}
            </Typography.Text>
            <Typography.Text type="secondary" ellipsis style={{ display: 'block', marginTop: 2, fontSize: 11 }}>
              {subText}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      title: 'Booking Code',
      dataIndex: 'booking_code',
      key: 'booking_code',
      align: 'left',
      width: 240,
      render: (value: string | null | undefined) => (
        <Typography.Text
          code
          copyable={value ? { text: value, tooltips: ['Copy booking code', 'Copied'] } : false}
          className={styles.bookingCode}
          style={{ maxWidth: '100%', fontSize: 12, color: 'var(--lm-text)' }}
        >
          {value || '—'}
        </Typography.Text>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      width: 140,
      align: 'left',
      key: 'created_at',
      sorter: { multiple: 1 },
      showSorterTooltip: { target: 'sorter-icon' },
      render: (_: unknown, record: BenchBookingItem) => (
        <DateRenderer value={record.created_at} />
      ),
    },
    {
      title: 'Starts',
      dataIndex: 'starts_at',
      key: 'starts_at',
      sorter: { multiple: 2 },
      showSorterTooltip: { target: 'sorter-icon' },
      width: 140,
      align: 'left',
      render: (_: unknown, record: BenchBookingItem) => (
        <DateRenderer value={record.starts_at} />
      ),
    },
    {
      title: 'Ends',
      dataIndex: 'ends_at',
      key: 'ends_at',
      sorter: { multiple: 3 },
      showSorterTooltip: { target: 'sorter-icon' },
      width: 140,
      align: 'left',
      render: (_: unknown, record: BenchBookingItem) => (
        <DateRenderer value={record.ends_at} />
      ),
    },
    {
      title: 'Project',
      key: 'project_id',
      width: 170,
      align: 'left',
      filters: projectList.map((p) => ({ text: p.label, value: p.value })),
      filterSearch: true,
      filterMultiple: true,
      filteredValue: filterParams?.project_id || filterParams?.project || [],
      filterOnClose: false,
      ellipsis: { showTitle: false },
      render: (_: unknown, record: BenchBookingItem) => {
        const projectName = record.project?.name;
        return (
          <Tooltip title={projectName || null} placement="topLeft">
            <Tag
              bordered={false}
              style={{
                maxWidth: '100%',
                marginInlineEnd: 0,
                overflow: 'hidden',
                color: 'var(--lm-text)',
                fontWeight: 500,
                textOverflow: 'ellipsis',
                background: 'var(--lm-surface-subtle)',
                whiteSpace: 'nowrap',
              }}
            >
              {projectName || '—'}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Booking Reason',
      key: 'reason',
      width: 260,
      align: 'left',
      render: (_: unknown, record: BenchBookingItem) => {
        const reason = record.reason;
        return (
          <Typography.Paragraph
            ellipsis={reason ? { rows: 2, tooltip: { title: reason, placement: 'topLeft' } } : false}
            style={{ marginBottom: 0, color: reason ? 'var(--lm-text)' : 'var(--lm-text-disabled)', lineHeight: 1.45 }}
          >
            {reason || '—'}
          </Typography.Paragraph>
        );
      },
    },
    {
      key: 'action',
      title: 'Action',
      fixed: 'right',
      align: 'center',
      width: 160,
      render: (_: unknown, record: BenchBookingItem) => {
        const canApprove =
          record.approval_status === 'pending' &&
          (record.status === 'reserved' || record.status === 'available') &&
          (!!permissionGroups['lab-coordinator'] || !!permissionGroups['admin']);
        const approvalBlockedReason = !(permissionGroups['lab-coordinator'] || permissionGroups['admin'])
          ? 'Only lab coordinators and admins can approve or reject bookings'
          : 'Only pending, upcoming bookings can be approved or rejected';

        return (
          <Space size="small">
            <TooltipButton
              placement="top"
              tooltip="Edit booking"
              disabledReason="Completed, expired or cancelled bookings can't be edited"
              icon={<EditOutlined />}
              disabled={
                record.status == null ||
                ['completed', 'expired', 'cancelled', 'done', 'cancel'].includes(record.status)
              }
              onClick={() => onEditBooking(record.id)}
            />
            <TooltipButton
              placement="top"
              tooltip="Approve booking"
              disabledReason={approvalBlockedReason}
              className={styles.approveButton}
              icon={<CheckCircleFilled />}
              disabled={!canApprove}
              onClick={() => onApproveBooking(record.id)}
            />
            <TooltipButton
              placement="top"
              tooltip="Reject booking"
              disabledReason={approvalBlockedReason}
              className={styles.rejectButton}
              icon={<CloseCircleFilled />}
              disabled={!canApprove}
              onClick={() => onRejectBooking(record.id)}
            />
          </Space>
        );
      },
    },
  ];
}
