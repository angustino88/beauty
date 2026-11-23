import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TablePaginationConfig } from 'antd/es/table';
import { Button, Card, Col, Row, Segmented, Select, Table, Typography } from 'antd';
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
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { getApiErrorMessage, notify } from '@/shared/notifications';
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

export default function SupportTickets() {
  const navigate = useNavigate();
  const { id: currentUserId } = useAuthState();
  const canManage = usePermission('support.handle');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [systemStateFilter, setSystemStateFilter] = useState<string>();
  const [priorityIdFilter, setPriorityIdFilter] = useState<number>();
  const [categoryIdFilter, setCategoryIdFilter] = useState<number>();
  const [ownershipScope, setOwnershipScope] = useState<OwnershipScope>('all');

  const debouncedSearch = useDebouncedValue(searchInput, 400);

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
      search: debouncedSearch || undefined,
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
    debouncedSearch,
    systemStateFilter,
    priorityIdFilter,
    categoryIdFilter,
    ownershipScope,
    currentUserId,
  ]);

  const { data, isFetching, refetch } = useGetSupportTicketsQuery(queryParams);

  const rows = data?.tickets ?? data?.issues ?? [];
  const total = data?.total ?? data?.count ?? 0;
  const stats = statsData?.data;
  const columns = useMemo(() => buildSupportTicketColumns(), []);

  const hasActiveFilters = Boolean(
    searchInput ||
      systemStateFilter ||
      priorityIdFilter !== undefined ||
      categoryIdFilter !== undefined ||
      ownershipScope !== 'all',
  );

  const clearFilters = () => {
    setSearchInput('');
    setSystemStateFilter(undefined);
    setPriorityIdFilter(undefined);
    setCategoryIdFilter(undefined);
    setOwnershipScope('all');
    setPage(1);
  };

  const handleRefresh = () => {
    void refetch();
    if (canManage) void refetchStats();
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    const nextPage = pagination.current ?? 1;
    const nextPageSize = pagination.pageSize ?? 10;
    if (nextPageSize !== pageSize) {
      setPage(1);
      setPageSize(nextPageSize);
      return;
    }
    setPage(nextPage);
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const fullData = await fetchSupportTicketsForExport({
        ...queryParams,
        page: 1,
        page_size: Math.min(total || pageSize, 100),
      });
      const allTickets = [...(fullData.tickets ?? fullData.issues ?? [])];
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

  const slaAttentionCount = stats
    ? (stats.sla?.overdue_resolution ?? 0) + (stats.sla?.response_breached ?? 0)
    : 0;

  return (
    <div className={tableStyles.registerPage}>
      <PageHeader title="Support tickets" />

      {canManage && stats && (
        <div className={styles.queueStatsGrid} role="region" aria-label="Support queue metrics">
          <button
            type="button"
            className={`${styles.statCard} ${
              systemStateFilter === 'open' && ownershipScope === 'all' ? styles.statCardActive : ''
            }`}
            onClick={() => {
              setSystemStateFilter((prev) => (prev === 'open' ? undefined : 'open'));
              setOwnershipScope('all');
              setPage(1);
            }}
          >
            <div className={styles.statCopy}>
              <span className={styles.statLabel}>Active Queue</span>
              <span className={styles.statValue}>{stats.open_total}</span>
              <span className={styles.statSubtext}>
                {stats.created} created · {stats.resolved} resolved ({stats.window_days}d)
              </span>
            </div>
            <span className={`${styles.statIconBox} ${styles.toneInfo}`} aria-hidden="true">
              <InboxOutlined />
            </span>
          </button>

          <button
            type="button"
            className={`${styles.statCard} ${
              ownershipScope === 'unassigned' ? styles.statCardActive : ''
            }`}
            onClick={() => {
              setOwnershipScope((prev) => (prev === 'unassigned' ? 'all' : 'unassigned'));
              setPage(1);
            }}
          >
            <div className={styles.statCopy}>
              <span className={styles.statLabel}>Unassigned</span>
              <span className={styles.statValue}>{stats.unassigned}</span>
              <span className={styles.statSubtext}>Click to filter tickets needing an owner</span>
            </div>
            <span className={`${styles.statIconBox} ${styles.toneWarning}`} aria-hidden="true">
              <UserSwitchOutlined />
            </span>
          </button>

          <button
            type="button"
            className={`${styles.statCard} ${
              ownershipScope === 'mine' ? styles.statCardActive : ''
            }`}
            onClick={() => {
              setOwnershipScope((prev) => (prev === 'mine' ? 'all' : 'mine'));
              setPage(1);
            }}
          >
            <div className={styles.statCopy}>
              <span className={styles.statLabel}>Assigned to Me</span>
              <span className={styles.statValue}>{stats.mine_open}</span>
              <span className={styles.statSubtext}>Click to focus on your active workload</span>
            </div>
            <span className={`${styles.statIconBox} ${styles.toneSuccess}`} aria-hidden="true">
              <TeamOutlined />
            </span>
          </button>

          <div className={styles.statCard} style={{ cursor: 'default' }}>
            <div className={styles.statCopy}>
              <span className={styles.statLabel}>SLA Attention</span>
              <span className={styles.statValue}>{slaAttentionCount}</span>
              <span className={styles.statSubtext}>
                {stats.sla?.paused ?? 0} paused · {stats.sla?.resolution_breached ?? 0} resolution breached
              </span>
            </div>
            <span
              className={`${styles.statIconBox} ${
                slaAttentionCount > 0 ? styles.toneDanger : styles.toneNeutral
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
            <Typography.Text type="secondary">
              Track requests, triage priorities, and manage ticket ownership in one workspace.
            </Typography.Text>
          </div>
          <Segmented
            aria-label="Filter tickets by lifecycle state"
            value={systemStateFilter ?? 'all'}
            onChange={(value) => {
              setSystemStateFilter(value === 'all' ? undefined : String(value));
              setPage(1);
            }}
            options={[
              { label: 'All tickets', value: 'all' },
              { label: 'Open', value: 'open' },
              { label: 'In Progress', value: 'active' },
              { label: 'Waiting', value: 'waiting' },
              { label: 'Resolved & Closed', value: 'done' },
            ]}
          />
        </div>

        <Row className={tableStyles.toolbar}>
          <Col flex="auto">
            <div className={styles.filterRow}>
              <FullTextSearch
                className={tableStyles.search}
                value={searchInput}
                onSearch={handleSearch}
                placeholder="Search tickets by key, subject, description…"
              />
              <Select<OwnershipScope>
                aria-label="Filter by ownership"
                value={ownershipScope}
                onChange={(val) => {
                  setOwnershipScope(val);
                  setPage(1);
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
                  setPriorityIdFilter(val);
                  setPage(1);
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
                  setCategoryIdFilter(val);
                  setPage(1);
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
              responsive
              tooltip="Open a support ticket"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              New Ticket
            </TooltipButton>
          </Col>
        </Row>

        <Table<SupportTicket>
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
                navigate(`/support-tickets/${encodeURIComponent(record.key)}`);
              }
            },
          })}
          sticky={{ offsetHeader: 60 }}
          pagination={{
            total,
            pageSizeOptions: [5, 10, 25, 50],
            pageSize,
            showQuickJumper: true,
            showSizeChanger: true,
            defaultPageSize: 10,
            current: page,
            showTotal: (count, range) => `${range[0]}–${range[1]} of ${count} tickets`,
          }}
          scroll={{ x: 1200 }}
        />
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
