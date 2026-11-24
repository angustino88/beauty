import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { TablePaginationConfig } from 'antd/es/table';
import { Button, Card, Col, Grid, Row, Segmented, Select, Table, Typography } from 'antd';
import {
  AlertOutlined,
  ClearOutlined,
  ExportOutlined,
  InboxOutlined,
  PlusOutlined,
  TeamOutlined,
  UndoOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout/PageHeader';
import { FullTextSearch } from '@/components/inputs/FullTextSearch';
import { TooltipButton } from '@/components/layout/TooltipButton';
import { useAuthState } from '@/features/auth/hooks/useAuthState';
import { usePermission } from '@/features/auth/hooks/useCan';
import { useSupportTicketsStatsRetrieveQuery } from '@/shared/api/generated/api';
import { getApiErrorMessage, InlineAlert, notify } from '@/shared/notifications';
import tableStyles from '@/components/tables/AppTable.module.css';
import {
  fetchSupportTicketsForExport,
  useGetSupportCategoriesQuery,
  useGetSupportPrioritiesQuery,
  useGetSupportTicketsQuery,
} from '../api';
import { CreateSupportTicketModal } from '../components/CreateSupportTicketModal';
import { buildSupportTicketColumns } from '../components/LabSupport.columns';
import styles from '../components/SupportTickets.module.css';
import type { SupportTicket, SupportTicketQueryParams } from '../types';
import { exportLabSupportExcel } from '../utils/export';

type OwnershipScope = 'all' | 'mine' | 'unassigned' | 'requested_by_me';

const lifecycleOptions = [
  { label: 'All tickets', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'active' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Resolved & Closed', value: 'done' },
];

function positiveInteger(value: string | null) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export default function SupportTickets() {
  const navigate = useNavigate();
  const compact = !Grid.useBreakpoint().md;
  const { id: currentUserId } = useAuthState();
  const canManage = usePermission('support.handle');

  const [params, setParams] = useSearchParams();
  const { search: queueSearch } = useLocation();
  const [exportLoading, setExportLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const page = positiveInteger(params.get('page')) ?? 1;
  const size = Number(params.get('page_size'));
  const pageSize = [5, 10, 25, 50].includes(size) ? size : 10;
  const searchInput = params.get('q') ?? '';
  const state = params.get('state');
  const systemStateFilter = state && ['open', 'active', 'waiting', 'done'].includes(state) ? state : undefined;
  const priorityIdFilter = positiveInteger(params.get('priority'));
  const categoryIdFilter = positiveInteger(params.get('category'));
  const owner = params.get('owner');
  const ownershipScope: OwnershipScope =
    owner === 'unassigned' || owner === 'mine' || owner === 'requested_by_me' ? owner : 'all';

  function updateQueue(changes: Record<string, string | number | undefined>) {
    const next = new URLSearchParams(params);
    next.delete('page');
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    }
    setParams(next, { replace: true, preventScrollReset: true });
  }

  const { data: categoriesData } = useGetSupportCategoriesQuery({});
  const { data: prioritiesData } = useGetSupportPrioritiesQuery({});
  const { data: statsData, refetch: refetchStats } = useSupportTicketsStatsRetrieveQuery(
    {},
    { skip: !canManage },
  );

  const queryParams = useMemo<SupportTicketQueryParams>(() => {
    const params: SupportTicketQueryParams = {
      page,
      page_size: pageSize,
      search: searchInput || undefined,
      system_state: systemStateFilter,
      priority_id: priorityIdFilter,
      category_id: categoryIdFilter,
    };
    if (ownershipScope === 'mine' && currentUserId) {
      params.assignee_id = currentUserId;
    } else if (ownershipScope === 'unassigned') {
      params.unassigned = true;
    } else if (ownershipScope === 'requested_by_me' && currentUserId) {
      params.requester_id = currentUserId;
    }
    return params;
  }, [
    page,
    pageSize,
    searchInput,
    systemStateFilter,
    priorityIdFilter,
    categoryIdFilter,
    ownershipScope,
    currentUserId,
  ]);

  const { data, isError, isFetching, refetch } = useGetSupportTicketsQuery(queryParams);

  const rows = data?.tickets ?? [];
  const total = data?.total ?? data?.count ?? 0;
  const stats = statsData?.data;
  const columns = useMemo(() => buildSupportTicketColumns(queueSearch, compact), [queueSearch, compact]);

  const hasActiveFilters = Boolean(
    searchInput ||
      systemStateFilter ||
      priorityIdFilter !== undefined ||
      categoryIdFilter !== undefined ||
      ownershipScope !== 'all',
  );

  const clearFilters = () => {
    updateQueue({ q: undefined, state: undefined, priority: undefined, category: undefined, owner: undefined });
  };

  const handleRefresh = () => {
    void refetch();
    if (canManage) void refetchStats();
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    const nextPage = pagination.current ?? 1;
    const nextPageSize = pagination.pageSize ?? 10;
    updateQueue({
      page: nextPageSize === pageSize && nextPage > 1 ? nextPage : undefined,
      page_size: nextPageSize === 10 ? undefined : nextPageSize,
    });
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const fullData = await fetchSupportTicketsForExport({
        ...queryParams,
        page: 1,
        page_size: Math.min(total || pageSize, 100),
      });
      const allTickets = [...fullData.tickets];
      let nextPage = 2;
      while (allTickets.length < fullData.total) {
        const nextData = await fetchSupportTicketsForExport({
          ...queryParams,
          page: nextPage,
          page_size: fullData.page_size || 100,
        });
        if (nextData.tickets.length === 0) break;
        allTickets.push(...nextData.tickets);
        nextPage += 1;
      }
      await exportLabSupportExcel(allTickets, 'Support Tickets');
      notify.success('Support tickets exported', {
        description: `Exported ${allTickets.length} ${allTickets.length === 1 ? 'ticket' : 'tickets'} to Excel.`,
      });
    } catch (error) {
      notify.error('Unable to export support tickets', {
        description: getApiErrorMessage(error, 'Please try again.'),
      });
    } finally {
      setExportLoading(false);
    }
  };

  const priorityOptions = useMemo(
    () => (prioritiesData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    [prioritiesData],
  );

  const categoryOptions = useMemo(
    () => (categoriesData?.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categoriesData],
  );

  return (
    <div className={tableStyles.registerPage}>
      <PageHeader title="Support tickets" />

      {canManage && stats && (
        <div className={styles.queueStatsGrid} role="region" aria-label="Support queue metrics">
          <div className={styles.statCard}>
            <div className={styles.statCopy}>
              <span className={styles.statLabel}>Unresolved tickets</span>
              <span className={styles.statValue}>{stats.open_total}</span>
              <span className={styles.statSubtext}>{stats.created} created · {stats.resolved} resolved in {stats.window_days} days</span>
            </div>
            <span className={`${styles.statIconBox} ${styles.toneInfo}`} aria-hidden="true"><InboxOutlined /></span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCopy}>
              <span className={styles.statLabel}>Unassigned</span>
              <span className={styles.statValue}>{stats.unassigned}</span>
              <span className={styles.statSubtext}>Unresolved tickets without an owner</span>
            </div>
            <span className={`${styles.statIconBox} ${styles.toneWarning}`} aria-hidden="true"><UserSwitchOutlined /></span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statCopy}>
              <span className={styles.statLabel}>Assigned to me</span>
              <span className={styles.statValue}>{stats.mine_open}</span>
              <span className={styles.statSubtext}>My unresolved tickets</span>
            </div>
            <span className={`${styles.statIconBox} ${styles.toneInfo}`} aria-hidden="true"><TeamOutlined /></span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCopy}>
              <span className={styles.statLabel}>Resolution overdue</span>
              <span className={styles.statValue}>{stats.sla?.overdue_resolution ?? 0}</span>
              <span className={styles.statSubtext}>
                {stats.sla?.paused ?? 0} paused · {stats.sla?.resolution_breached ?? 0} resolution breached
              </span>
            </div>
            <span
              className={`${styles.statIconBox} ${
                (stats.sla?.overdue_resolution ?? 0) > 0 ? styles.toneDanger : styles.toneNeutral
              }`}
              aria-hidden="true"
            >
              <AlertOutlined />
            </span>
          </div>
        </div>
      )}

      <Card className={`${tableStyles.tableCard} ${tableStyles.registerCard}`}>
        <div className={tableStyles.registerHeading}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Your support queue
            </Typography.Title>
            <Typography.Text type="secondary" role="status">
              {isError ? 'Queue unavailable' : isFetching ? 'Loading tickets…' : `${total} ${total === 1 ? 'ticket' : 'tickets'}${hasActiveFilters ? ' matching filters' : ''}`}
            </Typography.Text>
          </div>
          {compact ? (
            <Select
              aria-label="Filter tickets by lifecycle state"
              value={systemStateFilter ?? 'all'}
              options={lifecycleOptions}
              onChange={(value) => updateQueue({ state: value === 'all' ? undefined : value })}
              style={{ width: '100%' }}
            />
          ) : (
            <Segmented
              aria-label="Filter tickets by lifecycle state"
              value={systemStateFilter ?? 'all'}
              onChange={(value) => updateQueue({ state: value === 'all' ? undefined : String(value) })}
              options={lifecycleOptions}
            />
          )}
        </div>

        <Row className={tableStyles.toolbar}>
          <Col flex="auto">
            <div className={styles.filterRow}>
              <FullTextSearch
                className={tableStyles.search}
                value={searchInput}
                onSearch={(value) => updateQueue({ q: value.trim() })}
                placeholder="Search tickets by key, subject, description…"
              />
              <Select<OwnershipScope>
                aria-label="Filter by ownership"
                value={ownershipScope}
                onChange={(val) => {
                  updateQueue({ owner: val === 'all' ? undefined : val });
                }}
                style={{ width: 165 }}
                options={[
                  { value: 'all', label: 'All ownership' },
                  ...(currentUserId
                    ? [
                        { value: 'mine' as const, label: 'Assigned to me' },
                        { value: 'requested_by_me' as const, label: 'Requested by me' },
                      ]
                    : []),
                  { value: 'unassigned', label: 'Unassigned only' },
                ]}
              />
              <Select<number>
                aria-label="Filter by priority"
                placeholder="All priorities"
                allowClear
                value={priorityIdFilter}
                onChange={(val) => {
                  updateQueue({ priority: val });
                }}
                style={{ width: 145 }}
                options={priorityOptions}
              />
              <Select<number>
                aria-label="Filter by category"
                placeholder="All categories"
                allowClear
                value={categoryIdFilter}
                onChange={(val) => {
                  updateQueue({ category: val });
                }}
                style={{ width: 160 }}
                options={categoryOptions}
              />
              {hasActiveFilters && (
                <Button
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearFilters}
                  style={{ height: 30 }}
                >
                  Reset
                </Button>
              )}
            </div>
          </Col>
          <Col flex="none" className={tableStyles.actions}>
            <TooltipButton
              responsive
              tooltip="Reload tickets"
              icon={<UndoOutlined />}
              onClick={handleRefresh}
            >
              Refresh
            </TooltipButton>
            <TooltipButton
              responsive
              tooltip="Export tickets to Excel"
              disabledReason="No tickets to export"
              icon={<ExportOutlined />}
              loading={exportLoading}
              disabled={total === 0}
              onClick={() => void handleExport()}
            >
              Export
            </TooltipButton>
            <TooltipButton
              tooltip="Open a support ticket"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New ticket
            </TooltipButton>
          </Col>
        </Row>

        {isError && <InlineAlert variant="error" title="Unable to load the support queue" onRetry={() => void refetch()} />}
        {(!isError || rows.length > 0) && <Table<SupportTicket>
          className={tableStyles.table}
          columns={columns}
          tableLayout="auto"
          dataSource={rows}
          rowKey={(record) => String(record.id ?? record.key)}
          loading={{ spinning: isFetching, description: 'Loading tickets...' }}
          locale={{
            emptyText: hasActiveFilters
              ? 'No tickets match these filters. Try a broader search or reset the filters.'
              : 'No support tickets yet. Create a ticket to get help from the lab support team.',
          }}
          onChange={handleTableChange}
          onRow={(record) => ({
            style: { cursor: record.key ? 'pointer' : undefined },
            onClick: (event) => {
              const target = event.target as HTMLElement | null;
              if (target?.closest('a, button, input, .ant-select')) return;
              if (record.key) {
                navigate(`/support-tickets/${encodeURIComponent(record.key)}`, { state: { queueSearch } });
              }
            },
          })}
          sticky={{ offsetHeader: 60 }}
          pagination={{
            total,
            pageSizeOptions: [5, 10, 25, 50],
            pageSize,
            showQuickJumper: !compact,
            showSizeChanger: !compact,
            defaultPageSize: 10,
            current: page,
            showTotal: (count, range) => `${range[0]}–${range[1]} of ${count} tickets`,
          }}
          scroll={compact ? undefined : { x: 1200 }}
        />}
      </Card>

      <CreateSupportTicketModal
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          handleRefresh();
        }}
      />
    </div>
  );
}

export const LabSupport = SupportTickets;
