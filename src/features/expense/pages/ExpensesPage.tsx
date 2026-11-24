import React, { useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Select,
  Tooltip,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  DollarOutlined,
  WalletOutlined,
  CalendarOutlined,
  BuildOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { MetricCard, WorkspaceHero } from '@/features/finance/components/FinanceWorkspace';
import { formatMoney } from '@/features/finance/components/formatMoney';
import styles from '@/features/finance/components/FinanceWorkspace.module.css';
import { FullTextSearch } from '@/components/inputs/FullTextSearch';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import type { BillingPeriodEnum, ExpenseResourceKind, ExpenseTypeEnum, IExpense } from '../types';
import {
  BILLING_PERIOD_LABELS,
  EXPENSE_RESOURCE_KIND_LABELS,
  EXPENSE_TYPE_LABELS,
} from '../mapper';
import {
  useGetExpenseRoomsQuery,
  useGetFacilityExpensesQuery,
} from '../api';
import { CreateExpenseModal } from '../components/CreateExpenseModal';
import { ExpenseDetailDrawer } from '../components/ExpenseDetailDrawer';
import { RecordExpensePaymentModal } from '../components/RecordExpensePaymentModal';
import tableStyles from '@/components/tables/AppTable.module.css';

const EMPTY_EXPENSES: IExpense[] = [];

export const ExpensesPage: React.FC = () => {
  const [selectedResourceKind, setSelectedResourceKind] = useState<ExpenseResourceKind | undefined>(undefined);
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ExpenseTypeEnum | undefined>(undefined);
  const [periodFilter, setPeriodFilter] = useState<BillingPeriodEnum | undefined>(undefined);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<IExpense | null>(null);
  const [quickPaymentExpense, setQuickPaymentExpense] = useState<IExpense | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: rooms = [], isFetching: roomsLoading } = useGetExpenseRoomsQuery();

  const {
    data: expenseData,
    isFetching: expensesLoading,
    refetch,
  } = useGetFacilityExpensesQuery({
    roomId: selectedRoomId,
    resource_kind: selectedRoomId ? 'room' : selectedResourceKind,
    page,
    page_size: pageSize,
    expense_type: typeFilter,
    billing_period: periodFilter,
  });

  const rawExpenses = expenseData?.data ?? EMPTY_EXPENSES;
  const totalCount = expenseData?.pagination?.count ?? rawExpenses.length;

  const filteredExpenses = useMemo(() => {
    if (!debouncedSearch) return rawExpenses;
    const term = debouncedSearch.toLowerCase();
    return rawExpenses.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        e.resource_name?.toLowerCase().includes(term) ||
        e.supplier?.toLowerCase().includes(term) ||
        e.reference?.toLowerCase().includes(term) ||
        e.notes?.toLowerCase().includes(term),
    );
  }, [rawExpenses, debouncedSearch]);

  const kpis = useMemo(() => {
    const totals = rawExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.currency] = (acc[e.currency] ?? 0) + (Number(e.amount) || 0);
      return acc;
    }, {});
    const monthlyTotals = rawExpenses.filter((e) => e.billing_period === 'monthly').reduce<Record<string, number>>((acc, e) => {
      acc[e.currency] = (acc[e.currency] ?? 0) + (Number(e.amount) || 0);
      return acc;
    }, {});
    const activeContracts = rawExpenses.filter((e) => !e.valid_until || new Date(e.valid_until) >= new Date()).length;
    return { totals, monthlyTotals, activeContracts };
  }, [rawExpenses]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 10);
  };

  const columns: ColumnsType<IExpense> = [
    {
      title: 'Expense Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: IExpense) => (
        <Space orientation="vertical" size={2}>
          <span className={styles.rowTitle}>{name}</span>
          {record.reference && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Ref: {record.reference}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Resource',
      dataIndex: 'resource_name',
      key: 'resource_name',
      width: 185,
      render: (_: string | undefined, record: IExpense) => (
        <Space size={6}>
          <span className={styles.mutedTag}>{record.resource_kind_label}</span>
          <span>{record.resource_name || `${record.resource_kind_label} #${record.resource_id}`}</span>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'expense_type',
      key: 'expense_type',
      width: 140,
      render: (_: ExpenseTypeEnum, record: IExpense) => (
        <span className={styles.mutedTag}>{record.expense_type_label}</span>
      ),
    },
    {
      title: 'Cycle',
      dataIndex: 'billing_period',
      key: 'billing_period',
      width: 110,
      render: (_: unknown, record: IExpense) => <span className={styles.mutedTag}>{record.billing_period_label}</span>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      width: 130,
      render: (amt: string, record: IExpense) => (
        <span className={styles.amount}>{formatMoney(Number(amt) || 0, record.currency)}</span>
      ),
    },
    {
      title: 'Validity',
      key: 'validity',
      width: 180,
      render: (_: unknown, record: IExpense) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {record.valid_from} → {record.valid_until || 'Ongoing'}
        </Typography.Text>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (sup?: string) => sup || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 160,
      render: (_: unknown, record: IExpense) => (
        <Space size={6}>
          <Tooltip title="View expense details and payment history">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedExpense(record)}
            >
              Details
            </Button>
          </Tooltip>
          <Tooltip title={`Record a payment for ${record.name}`}>
            <Button
              size="small"
              icon={<DollarOutlined />}
              aria-label={`Record payment for ${record.name}`}
              onClick={() => setQuickPaymentExpense(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={`${styles.workspace} ${styles.register} ${tableStyles.registerPage}`}>
      <WorkspaceHero
        eyebrow="Finance / Facility operations"
        title="Facility expenses"
        description="Stay ahead of recurring obligations, supplier costs and payment activity across the lab."
        icon={<WalletOutlined />}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void refetch()} loading={expensesLoading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Expense
            </Button>
          </Space>
        }
      />

      <div className={styles.metricGrid}>
        <MetricCard label="Expenses" value={totalCount.toLocaleString()} note="Obligations in the register" icon={<WalletOutlined />} />
        <MetricCard label="Listed commitments" value={Object.keys(kpis.totals).length === 1 ? formatMoney(Object.values(kpis.totals)[0], Object.keys(kpis.totals)[0]) : Object.keys(kpis.totals).length === 0 ? '—' : 'Multiple currencies'} note="Current page · across billing cycles" icon={<DollarOutlined />} accent="#38789a" tint="#eaf3f8" />
        <MetricCard label="Monthly commitments" value={Object.keys(kpis.monthlyTotals).length === 1 ? formatMoney(Object.values(kpis.monthlyTotals)[0], Object.keys(kpis.monthlyTotals)[0]) : Object.keys(kpis.monthlyTotals).length === 0 ? '—' : 'Multiple currencies'} note="Monthly items on this page" icon={<CalendarOutlined />} accent="#7a668f" tint="#f2eff7" />
        <MetricCard label="Active agreements" value={kpis.activeContracts.toLocaleString()} note="Current items on this page" icon={<ApartmentOutlined />} accent="#aa7532" tint="#fcf3e6" />
      </div>

      <section className={styles.surface} aria-label="Facility expense register">
        <div className={styles.surfaceHeading}>
          <div><h2 className={styles.surfaceTitle}>Expense register</h2><p className={styles.surfaceDescription}>Filter by resource type, room, category or billing cycle to find an obligation.</p></div>
          <span className={styles.count}>{totalCount.toLocaleString()} expenses</span>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <div className={styles.filterField}>
              <label htmlFor="expense-resource-kind-filter">Resource type</label>
              <Select
                id="expense-resource-kind-filter"
                style={{ width: 150 }}
                allowClear
                placeholder="All Resources"
                value={selectedResourceKind}
                onChange={(val: ExpenseResourceKind | undefined) => {
                  setSelectedResourceKind(val);
                  if (val && val !== 'room') {
                    setSelectedRoomId(undefined);
                  }
                  setPage(1);
                }}
                options={Object.entries(EXPENSE_RESOURCE_KIND_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>

            <div className={styles.filterField}>
              <label htmlFor="expense-room-filter">Facility / room</label>
              <Select
                id="expense-room-filter"
                style={{ width: 210 }}
                loading={roomsLoading}
                allowClear
                value={selectedRoomId}
                onChange={(val) => {
                  setSelectedRoomId(val);
                  if (val) setSelectedResourceKind('room');
                  setPage(1);
                }}
                options={rooms.map((r) => ({
                  label: (
                    <Space>
                      <BuildOutlined />
                      <span>{r.name}</span>
                    </Space>
                  ),
                  value: r.id,
                }))}
                placeholder="All Rooms"
              />
            </div>

            <div className={styles.filterField}>
              <label htmlFor="expense-type-filter">Expense type</label>
              <Select
                id="expense-type-filter"
                style={{ width: 160 }}
                allowClear
                placeholder="All Types"
                value={typeFilter}
                onChange={(val) => {
                  setTypeFilter(val);
                  setPage(1);
                }}
                options={Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>

            <div className={styles.filterField}>
              <label htmlFor="expense-cycle-filter">Billing cycle</label>
              <Select
                id="expense-cycle-filter"
                style={{ width: 150 }}
                allowClear
                placeholder="All Cycles"
                value={periodFilter}
                onChange={(val) => {
                  setPeriodFilter(val);
                  setPage(1);
                }}
                options={Object.entries(BILLING_PERIOD_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>

            <div className={`${styles.filterField} ${styles.filterSearch}`}>
              <label>Search expenses</label>
              <FullTextSearch
                value={search}
                onSearch={setSearch}
                placeholder="Search name, resource, supplier, ref..."
              />
            </div>
          </div>

          {search && <Typography.Text className={styles.toolbarMeta}>{filteredExpenses.length} matching on this page</Typography.Text>}
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredExpenses}
          loading={expensesLoading}
          pagination={{
            current: page,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} expenses`,
          }}
          onChange={handleTableChange}
          className={`${tableStyles.table} ${styles.tableWrap}`}
          scroll={{ x: 1070 }}
          size="middle"
        />
      </section>

      <CreateExpenseModal
        open={isCreateOpen}
        rooms={rooms}
        defaultResourceKind={selectedResourceKind ?? 'room'}
        defaultRoomId={selectedRoomId ?? rooms[0]?.id}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => void refetch()}
      />

      <ExpenseDetailDrawer
        open={Boolean(selectedExpense)}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />

      {quickPaymentExpense && (
        <RecordExpensePaymentModal
          open={Boolean(quickPaymentExpense)}
          expenseId={quickPaymentExpense.id}
          expenseName={quickPaymentExpense.name}
          currency={quickPaymentExpense.currency}
          onClose={() => setQuickPaymentExpense(null)}
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
