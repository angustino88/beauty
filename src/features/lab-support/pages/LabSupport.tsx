import { useMemo, useState } from 'react';
import type { TablePaginationConfig } from 'antd/es/table';
import { Card, Col, Row, Segmented, Table, Typography } from 'antd';
import { getApiErrorMessage, notify } from '@/shared/notifications';
import { ExportOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout/PageHeader';
import { FullTextSearch } from '@/components/inputs/FullTextSearch';
import { TooltipButton } from '@/components/layout/TooltipButton';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { fetchSupportTicketsForExport, useGetSupportTicketsQuery } from '../api';
import { exportLabSupportExcel } from '../utils/export';
import type { SupportTicket } from '../types';
import { buildSupportTicketColumns } from '../components/LabSupport.columns';
import { CreateSupportTicketModal } from '../components/CreateSupportTicketModal';
import tableStyles from '@/components/tables/AppTable.module.css';

export default function SupportTickets() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>();

  const debouncedSearch = useDebouncedValue(searchInput, 500);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedSearch || undefined,
      status: statusFilter,
    }),
    [page, pageSize, debouncedSearch, statusFilter],
  );

  const { data, isFetching, refetch } = useGetSupportTicketsQuery(queryParams);

  const rows = data?.tickets ?? data?.issues ?? [];
  const total = data?.total ?? data?.count ?? 0;
  const columns = useMemo(() => buildSupportTicketColumns(), []);

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
        page: 1,
        page_size: Math.min(total || pageSize, 100),
        search: debouncedSearch || undefined,
        status: statusFilter,
      });
      const allTickets = [...(fullData.tickets ?? fullData.issues ?? [])];
      let nextPage = 2;
      while (allTickets.length < fullData.total) {
        const nextData = await fetchSupportTicketsForExport({
          page: nextPage,
          page_size: fullData.page_size || 100,
          search: debouncedSearch || undefined,
          status: statusFilter,
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

  return (
    <div className={tableStyles.registerPage}>
      <PageHeader title="Support tickets" />
      <Card className={`${tableStyles.tableCard} ${tableStyles.registerCard}`}>
        <div className={tableStyles.registerHeading}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>Your support queue</Typography.Title>
            <Typography.Text type="secondary">Track requests, ownership, and recent updates in one place.</Typography.Text>
          </div>
          <Segmented
            aria-label="Filter tickets by status"
            value={statusFilter ?? 'all'}
            onChange={(value) => {
              setStatusFilter(value === 'all' ? undefined : String(value));
              setPage(1);
            }}
            options={[
              { label: 'All tickets', value: 'all' },
              { label: 'Open', value: 'open' },
              { label: 'In progress', value: 'in_progress' },
              { label: 'Resolved', value: 'resolved' },
            ]}
          />
        </div>
        <Row className={tableStyles.toolbar}>
          <Col flex="auto">
            <FullTextSearch
              className={tableStyles.search}
              value={searchInput}
              onSearch={handleSearch}
              placeholder="Search tickets by key, subject, requester…"
            />
          </Col>
          <Col flex="auto" className={tableStyles.actions}>
            <TooltipButton responsive tooltip="Reload tickets" icon={<UndoOutlined />} onClick={() => refetch()}>
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
          loading={{ spinning: isFetching, description: 'Loading...' }}
          locale={{ emptyText: searchInput || statusFilter
            ? 'No tickets match these filters. Try a broader search or clear the status filter.'
            : 'No support tickets yet. Create a ticket to get help from the lab support team.' }}
          onChange={handleTableChange}
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
          void refetch();
        }}
      />
    </div>
  );
}

export const LabSupport = SupportTickets;
