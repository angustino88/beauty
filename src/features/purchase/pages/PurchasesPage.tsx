import React, { useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Segmented,
  Dropdown,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  DollarOutlined,
  EditOutlined,
  MoreOutlined,
  ShopOutlined,
  OrderedListOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { MetricCard, WorkspaceHero } from '@/features/finance/components/FinanceWorkspace';
import { formatMoney } from '@/features/finance/components/formatMoney';
import styles from '@/features/finance/components/FinanceWorkspace.module.css';
import { FullTextSearch } from '@/components/inputs/FullTextSearch';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import type { IPurchase } from '../types';
import {
  useGetPurchasesQuery,
} from '../api';
import { CreatePurchaseModal } from '../components/CreatePurchaseModal';
import { EditPurchaseDraftModal } from '../components/EditPurchaseDraftModal';
import { PurchaseDetailDrawer } from '../components/PurchaseDetailDrawer';
import { AddPurchaseTransactionModal } from '../components/AddPurchaseTransactionModal';
import { AddPurchaseItemModal } from '../components/AddPurchaseItemModal';
import tableStyles from '@/components/tables/AppTable.module.css';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { purchaseStatusLabel, purchaseStatusTone } from '@/shared/status/statusTone';

const EMPTY_PURCHASES: IPurchase[] = [];

export const PurchasesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'ordered' | 'received' | 'cancelled'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<IPurchase | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<IPurchase | null>(null);
  const [quickTransactionPurchase, setQuickTransactionPurchase] = useState<IPurchase | null>(null);
  const [quickItemPurchase, setQuickItemPurchase] = useState<IPurchase | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isFetching, refetch } = useGetPurchasesQuery({
    page,
    page_size: pageSize,
  });

  const rawPurchases = data?.data ?? EMPTY_PURCHASES;
  const totalCount = data?.pagination?.count ?? rawPurchases.length;

  const kpis = useMemo(() => {
    const totals = rawPurchases.reduce<Record<string, number>>((acc, p) => {
      acc[p.currency] = (acc[p.currency] ?? 0) + (Number(p.total_amount) || 0);
      return acc;
    }, {});
    const suppliers = new Set(rawPurchases.map((p) => p.supplier.trim())).size;
    const totalItems = rawPurchases.reduce((acc, p) => acc + (p.item_count || 0), 0);
    const draftCount = rawPurchases.filter((p) => (p.status || '').toLowerCase() === 'draft').length;
    return { totals, suppliers, totalItems, draftCount };
  }, [rawPurchases]);

  const filteredPurchases = useMemo(() => {
    let list = rawPurchases;
    if (statusFilter !== 'all') {
      list = list.filter((p) => (p.status || '').toLowerCase() === statusFilter);
    }
    if (!debouncedSearch) return list;
    const term = debouncedSearch.toLowerCase();
    return list.filter(
      (p) =>
        p.supplier.toLowerCase().includes(term) ||
        p.purchase_order_number.toLowerCase().includes(term) ||
        p.notes?.toLowerCase().includes(term),
    );
  }, [rawPurchases, statusFilter, debouncedSearch]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 10);
  };

  const columns: ColumnsType<IPurchase> = [
    {
      title: 'PO #',
      dataIndex: 'purchase_order_number',
      key: 'purchase_order_number',
      render: (val: string, record: IPurchase) => (
        <div>
          <div className={styles.rowTitle}>{val || `PO-${record.id}`}</div>
          <div className={styles.rowMeta}>Order #{record.id}</div>
        </div>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (text: string) => text || '—',
    },
    {
      title: 'Order Date',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      width: 120,
    },
    {
      title: 'Total Agreed',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (val: string, record: IPurchase) => (
        <span className={styles.amount}>{formatMoney(Number(val) || 0, record.currency)}</span>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'item_count',
      key: 'item_count',
      align: 'center',
      width: 90,
      render: (count: number) => <span className={styles.mutedTag}>{count} items</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string, record: IPurchase) => {
        return <StatusBadge tone={purchaseStatusTone(status)} label={record.status_label || purchaseStatusLabel(status)} />;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      width: 142,
      render: (_: unknown, record: IPurchase) => {
        return (
          <Space size={6}>
            <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedPurchase(record)}>
              View
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'edit', label: 'Edit order', icon: <EditOutlined /> },
                  { key: 'item', label: 'Add line item', icon: <PlusOutlined /> },
                  { key: 'payment', label: 'Record payment / refund', icon: <DollarOutlined /> },
                ],
                onClick: ({ key }) => {
                  if (key === 'edit') setEditingPurchase(record);
                  else if (key === 'item') setQuickItemPurchase(record);
                  else if (key === 'payment') setQuickTransactionPurchase(record);
                },
              }}
            >
              <Button size="small" icon={<MoreOutlined />} aria-label={`More actions for ${record.purchase_order_number || `order ${record.id}`}`} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={`${styles.workspace} ${styles.register} ${tableStyles.registerPage}`}>
      <WorkspaceHero
        eyebrow="Procurement / Order management"
        title="Purchase orders"
        description="Manage supplier orders, track commitments and keep every acquisition moving."
        icon={<ShopOutlined />}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void refetch()} loading={isFetching}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
              New Purchase Order
            </Button>
          </Space>
        }
      />

      <div className={styles.metricGrid}>
        <MetricCard label="Purchase orders" value={totalCount.toLocaleString()} note="Orders in the register" icon={<OrderedListOutlined />} />
        <MetricCard label="Draft orders" value={kpis.draftCount.toLocaleString()} note="Awaiting submission · current page" icon={<EditOutlined />} accent="#aa7532" tint="#fcf3e6" />
        <MetricCard label="Order value" value={Object.keys(kpis.totals).length === 1 ? formatMoney(Object.values(kpis.totals)[0], Object.keys(kpis.totals)[0]) : Object.keys(kpis.totals).length === 0 ? '—' : 'Multiple currencies'} note="Current page · not currency-converted" icon={<DollarOutlined />} accent="#38789a" tint="#eaf3f8" />
        <MetricCard label="Suppliers" value={kpis.suppliers.toLocaleString()} note={`${kpis.totalItems} line items on this page`} icon={<SafetyCertificateOutlined />} accent="#7a668f" tint="#f2eff7" />
      </div>

      <section className={styles.surface} aria-label="Purchase order register">
        <div className={styles.surfaceHeading}>
          <div><h2 className={styles.surfaceTitle}>Order register</h2><p className={styles.surfaceDescription}>Review orders and manage their next steps.</p></div>
          <span className={styles.count}>{totalCount.toLocaleString()} orders</span>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.purchaseFilters}>
            <div className={styles.statusFilter}>
              <Segmented
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as 'all' | 'draft' | 'ordered' | 'received' | 'cancelled');
                  setPage(1);
                }}
                options={[
                  { label: 'All Orders', value: 'all' },
                  {
                    label: (
                      <Space size={6}>
                        <span>Drafts on this page</span>
                        {kpis.draftCount > 0 && <span>({kpis.draftCount})</span>}
                      </Space>
                    ),
                    value: 'draft',
                  },
                  { label: 'Ordered', value: 'ordered' },
                  { label: 'Received', value: 'received' },
                  { label: 'Cancelled', value: 'cancelled' },
                ]}
              />
            </div>
            <FullTextSearch
              placeholder="Search by supplier, PO # or notes..."
              value={search}
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
            />
          </div>
          {debouncedSearch && (
            <Typography.Text type="secondary" className={styles.filterSummary}>
              Showing search results matching &ldquo;{debouncedSearch}&rdquo;
            </Typography.Text>
          )}
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredPurchases}
          loading={isFetching}
          pagination={{
            current: page,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
          }}
          onChange={handleTableChange}
          className={`${tableStyles.table} ${styles.tableWrap}`}
          scroll={{ x: 1040 }}
          size="middle"
        />
      </section>

      <CreatePurchaseModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => void refetch()}
      />

      <EditPurchaseDraftModal
        open={Boolean(editingPurchase)}
        purchase={editingPurchase}
        onClose={() => setEditingPurchase(null)}
        onSuccess={() => void refetch()}
      />

      <PurchaseDetailDrawer
        open={Boolean(selectedPurchase)}
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
      />

      {quickTransactionPurchase && (
        <AddPurchaseTransactionModal
          open={Boolean(quickTransactionPurchase)}
          purchaseId={quickTransactionPurchase.id}
          currency={quickTransactionPurchase.currency}
          onClose={() => setQuickTransactionPurchase(null)}
          onSuccess={() => void refetch()}
        />
      )}

      {quickItemPurchase && (
        <AddPurchaseItemModal
          open={Boolean(quickItemPurchase)}
          purchaseId={quickItemPurchase.id}
          onClose={() => setQuickItemPurchase(null)}
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
};

export default PurchasesPage;
