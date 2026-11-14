import React, { useState } from 'react';
import {
  Drawer,
  Tag,
  Tabs,
  Table,
  Button,
  Space,
  Typography,
  Popconfirm,
  Tooltip,
  Dropdown,
  Modal,
  message,
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  LinkOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '@/features/finance/components/FinanceWorkspace.module.css';
import detailStyles from './PurchaseDetail.module.css';
import { formatMoney } from '@/features/finance/components/formatMoney';
import type { IPurchase, IPurchaseItem, IPurchaseTransaction } from '../types';
import { getPurchaseEtag, getItemEtag } from '../mapper';
import {
  useDeletePurchaseItemMutation,
  useGetPurchaseByIdQuery,
  useGetPurchaseItemResourcesQuery,
  useGetPurchaseItemsQuery,
  useGetPurchaseTransactionsQuery,
  useUpdatePurchaseDraftHeaderMutation,
} from '../api';
import { AddPurchaseItemModal } from './AddPurchaseItemModal';
import { EditPurchaseItemModal } from './EditPurchaseItemModal';
import { EditPurchaseDraftModal } from './EditPurchaseDraftModal';
import { AddPurchaseTransactionModal } from './AddPurchaseTransactionModal';
import { AllocateResourceModal } from './AllocateResourceModal';
import { PurchaseLifecycle } from './PurchaseLifecycle';

const AllocatedResourceCell: React.FC<{
  purchaseItemId: number;
  currency: string;
  onAllocate: () => void;
}> = ({ purchaseItemId, currency, onAllocate }) => {
  const { data, isFetching } = useGetPurchaseItemResourcesQuery({ purchaseItemId });
  const resources = data?.data ?? [];

  if (isFetching) {
    return <Typography.Text type="secondary" style={{ fontSize: 11 }}>Checking...</Typography.Text>;
  }

  if (resources.length === 0) {
    return (
      <Button
        size="small"
        type="dashed"
        icon={<LinkOutlined />}
        onClick={onAllocate}
      >
        Link resource
      </Button>
    );
  }

  return (
    <Space direction="vertical" size={2}>
      {resources.map((r) => (
        <Tag key={r.id} style={{ cursor: 'pointer', padding: '2px 6px', color: 'var(--lm-text-secondary)', background: 'var(--lm-surface-muted)', borderColor: 'var(--lm-border)' }} onClick={onAllocate}>
          <strong>{(r.resource_kind || 'ASSET').toUpperCase()} #{r.resource_id}</strong>
          {r.resource_name ? ` — ${r.resource_name}` : ''}
          {r.acquisition_price ? ` [${currency} ${r.acquisition_price}]` : ''}
        </Tag>
      ))}
      <Button
        size="small"
        type="link"
        icon={<LinkOutlined />}
        onClick={onAllocate}
        style={{ padding: 0, fontSize: 11, height: 'auto' }}
      >
        + Add Allocation
      </Button>
    </Space>
  );
};

const AllocatedResourcesSubTable: React.FC<{ purchaseItemId: number; currency: string }> = ({
  purchaseItemId,
  currency,
}) => {
  const { data, isFetching } = useGetPurchaseItemResourcesQuery({ purchaseItemId });
  const resources = data?.data ?? [];

  if (isFetching) {
    return <Typography.Text type="secondary">Loading allocated resources...</Typography.Text>;
  }
  if (resources.length === 0) {
    return (
      <Typography.Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12 }}>
        No physical hardware allocated to this line item yet. Click "Allocate Resource" to link equipment.
      </Typography.Text>
    );
  }

  return (
    <div style={{ margin: '6px 0', background: 'var(--lm-surface-subtle)', padding: 10, borderRadius: 6, border: '1px solid var(--lm-border-subtle)' }}>
      <Typography.Text strong style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
        Allocated Assets ({resources.length}):
      </Typography.Text>
      <Space wrap size={8}>
        {resources.map((r) => (
          <Tag key={r.id} style={{ padding: '4px 8px', color: 'var(--lm-text-secondary)', background: 'var(--lm-surface-muted)', borderColor: 'var(--lm-border)' }}>
            <strong>{(r.resource_kind || 'ASSET').toUpperCase()} #{r.resource_id}</strong>
            {r.resource_name ? ` — ${r.resource_name}` : ''}
            {r.acquisition_price ? ` [Price: ${currency} ${r.acquisition_price}]` : ''}
          </Tag>
        ))}
      </Space>
    </div>
  );
};

interface PurchaseDetailDrawerProps {
  open: boolean;
  purchase: IPurchase | null;
  onClose: () => void;
}

export const PurchaseDetailDrawer: React.FC<PurchaseDetailDrawerProps> = ({
  open,
  purchase,
  onClose,
}) => {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [allocatingItem, setAllocatingItem] = useState<IPurchaseItem | null>(null);
  const [editingItem, setEditingItem] = useState<IPurchaseItem | null>(null);
  const [isEditDraftOpen, setIsEditDraftOpen] = useState(false);

  const purchaseId = purchase?.id ?? 0;
  const { data: freshPurchase } = useGetPurchaseByIdQuery(purchaseId, { skip: !purchaseId || !open });
  const order = freshPurchase?.id === purchaseId ? freshPurchase : purchase;
  const [deleteItem] = useDeletePurchaseItemMutation();
  const [updateDraftHeader, { isLoading: updatingStatus }] = useUpdatePurchaseDraftHeaderMutation();

  const {
    data: itemsData,
    isFetching: itemsLoading,
    refetch: refetchItems,
  } = useGetPurchaseItemsQuery(
    { purchaseId },
    { skip: !purchaseId || !open },
  );

  const {
    data: transactionsData,
    isFetching: transactionsLoading,
    refetch: refetchTransactions,
  } = useGetPurchaseTransactionsQuery(
    { purchaseId },
    { skip: !purchaseId || !open },
  );

  if (!order) return null;

  const items = itemsData?.data ?? [];
  const transactions = transactionsData?.data ?? [];

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateDraftHeader({
        purchaseId,
        body: { status: newStatus },
        ifMatch: getPurchaseEtag(order),
      }).unwrap();
      void message.success(`Purchase order status updated to ${newStatus.toUpperCase()}`);
      void refetchItems();
      void refetchTransactions();
    } catch (err: unknown) {
      const errorData = (err as { data?: { error?: { message?: string } } })?.data;
      const errorMsg =
        errorData?.error?.message ||
        (typeof errorData === 'string'
          ? errorData
          : 'Failed to update order status');
      void message.error(errorMsg);
    }
  };

  const statusLower = (order.status || '').toLowerCase();
  const statusTone = statusLower === 'ordered' ? detailStyles.ordered
    : ['received', 'completed', 'approved'].includes(statusLower) ? detailStyles.received
    : statusLower === 'cancelled' ? detailStyles.cancelled : '';
  const statusHint = statusLower === 'draft' ? 'In preparation'
    : statusLower === 'ordered' ? 'Awaiting delivery'
    : statusLower === 'received' ? 'Delivery confirmed'
    : statusLower === 'cancelled' ? 'Order closed' : 'Order status';

  const handleDeleteItem = async (item: IPurchaseItem) => {
    try {
      await deleteItem({
        purchaseId,
        itemId: item.id,
        ifMatch: getItemEtag(item),
      }).unwrap();
      void message.success('Line item deleted successfully');
      void refetchItems();
    } catch (err: unknown) {
      const errorData = (err as { data?: { error?: { message?: string } } })?.data;
      const errorMsg =
        errorData?.error?.message ||
        (typeof errorData === 'string'
          ? errorData
          : 'Failed to delete line item');
      void message.error(errorMsg);
    }
  };

  const totalPaid = transactions
    .filter((t) => t.transaction_type === 'payment')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

  const totalRefunded = transactions
    .filter((t) => t.transaction_type === 'refund')
    .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

  const netSettled = totalPaid - totalRefunded;
  const agreedTotal = parseFloat(order.total_amount || '0');
  const outstandingBalance = Math.max(0, agreedTotal - netSettled);

  const itemColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 210,
      render: (text: string, record: IPurchaseItem) => (
        <Space direction="vertical" size={1}>
          <strong>{text}</strong>
          {record.purpose && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Purpose: {record.purpose}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Priority',
      key: 'priority',
      width: 95,
      render: (_: unknown, record: IPurchaseItem) => {
        if (!record.priority_name && !record.priority_code) return <Typography.Text type="secondary">—</Typography.Text>;
        const code = (record.priority_code || '').toLowerCase();
        let color = 'default';
        if (code === 'critical') color = 'error';
        else if (code === 'high') color = 'warning';
        else if (code === 'medium') color = 'processing';
        else if (code === 'low') color = 'success';
        return <Tag color={color}>{record.priority_name || record.priority_code}</Tag>;
      },
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (qty: number, record: IPurchaseItem) => `${qty} ${record.unit || 'pcs'}`,
    },
    {
      title: 'Unit price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 115,
      align: 'right' as const,
      render: (val: string) => formatMoney(Number(val) || 0, order.currency),
    },
    {
      title: 'Line Total',
      key: 'line_total',
      width: 120,
      align: 'right' as const,
      render: (_: unknown, record: IPurchaseItem) => {
        const lineVal = record.line_value
          ? parseFloat(record.line_value)
          : record.quantity * parseFloat(record.unit_price || '0');
        return <span className={styles.amount}>{formatMoney(lineVal, order.currency)}</span>;
      },
    },
    {
      title: 'Linked assets',
      key: 'linked_resource',
      width: 180,
      render: (_: unknown, record: IPurchaseItem) => (
        <AllocatedResourceCell
          purchaseItemId={record.id}
          currency={order.currency}
          onAllocate={() => setAllocatingItem(record)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: IPurchaseItem) => (
        <Space size={4}>
          <Tooltip title="Edit Item">
            <Button
              size="small"
              icon={<EditOutlined />}
              aria-label={`Edit ${record.description}`}
              onClick={() => setEditingItem(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Line Item"
            description="Are you sure you want to delete this line item?"
            onConfirm={() => handleDeleteItem(record)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Item">
              <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Delete ${record.description}`} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'refund' ? 'warning' : 'success'}>
          {type ? type.toUpperCase() : 'PAYMENT'}
        </Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string, record: IPurchaseTransaction) => (
        <strong style={{ color: record.transaction_type === 'refund' ? 'var(--lm-warning-fg)' : 'var(--lm-success-fg)' }}>
          {record.transaction_type === 'refund' ? '-' : '+'} {order.currency}{' '}
          {parseFloat(amount || '0').toFixed(2)}
        </strong>
      ),
    },
    {
      title: 'Settled Date',
      dataIndex: 'settled_at',
      key: 'settled_at',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (ref?: string) => ref || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes?: string) => notes || <Typography.Text type="secondary">—</Typography.Text>,
    },
  ];

  return (
    <>
      <Drawer
        title={
          <div className={detailStyles.header}>
            <small>Purchase order</small>
            <strong>{order.purchase_order_number || `Order #${order.id}`}</strong>
          </div>
        }
        className={detailStyles.drawer}
        placement="right"
        width="min(920px, 100vw)"
        open={open}
        onClose={onClose}
      >
        <div className={detailStyles.body}>
        <div className={detailStyles.identity}>
          <div>
            <h2 className={detailStyles.supplier}>{order.supplier || 'Supplier not specified'}</h2>
            <div className={detailStyles.subtitle}>Order #{order.id} · {order.purchase_date ? dayjs(order.purchase_date).format('DD MMM YYYY') : 'No order date'}</div>
          </div>
          <div className={detailStyles.actions}>
            <Button icon={<EditOutlined />} onClick={() => setIsEditDraftOpen(true)}>Edit details</Button>
          </div>
        </div>
        <div className={detailStyles.statusBar}>
          <div className={detailStyles.statusCopy}>
            <span className={`${detailStyles.status} ${statusTone}`}>{order.status_label || (order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase() : 'Unknown')}</span>
            <span className={detailStyles.statusHint}>{statusHint}</span>
          </div>
          <Dropdown
            menu={{
              items: [
                { key: 'draft', label: 'Mark as Draft', disabled: statusLower === 'draft' },
                { key: 'ordered', label: 'Mark as Ordered (PO Issued)', disabled: statusLower === 'ordered' },
                { key: 'received', label: 'Mark as Received (Delivered)', disabled: statusLower === 'received' },
                { type: 'divider' },
                { key: 'cancelled', label: 'Cancel Order', danger: true, disabled: statusLower === 'cancelled' },
              ],
              onClick: ({ key }) => {
                if (key === 'cancelled') {
                  Modal.confirm({
                    title: 'Cancel this purchase order?',
                    content: 'Existing items and payment records will remain available.',
                    okText: 'Cancel order',
                    cancelText: 'Keep order',
                    okButtonProps: { danger: true },
                    onOk: () => handleStatusChange(key),
                  });
                } else void handleStatusChange(key);
              },
            }}
          >
            <Button type="text" size="small" loading={updatingStatus}>Update status <DownOutlined /></Button>
          </Dropdown>
        </div>
        <PurchaseLifecycle status={order.status || ''} />
        <section className={detailStyles.moneyGrid} aria-label="Order financial summary">
          <div className={detailStyles.money}><label>Agreed order value</label><strong>{formatMoney(agreedTotal, order.currency)}</strong><small>Supplier commitment</small></div>
          <div className={detailStyles.money}><label>Net paid</label><strong>{transactionsLoading ? '—' : formatMoney(netSettled, order.currency)}</strong><small>Payments less refunds · loaded records</small></div>
          <div className={detailStyles.money}><label>Remaining balance</label><strong>{transactionsLoading ? '—' : formatMoney(outstandingBalance, order.currency)}</strong><small>Agreed value less net payments</small></div>
        </section>
        <section className={detailStyles.panel} aria-label="Order information">
          <div className={detailStyles.panelHeading}><h3>Order information</h3><Button type="text" size="small" icon={<EditOutlined />} onClick={() => setIsEditDraftOpen(true)}>Edit</Button></div>
          <dl className={detailStyles.metadata}>
            <div><dt>PO number</dt><dd>{order.purchase_order_number || 'Not assigned'}</dd></div>
            <div><dt>Order date</dt><dd>{order.purchase_date ? dayjs(order.purchase_date).format('DD MMM YYYY') : '—'}</dd></div>
            <div><dt>Currency</dt><dd>{order.currency}</dd></div>
            <div><dt>Line items</dt><dd>{order.item_count}</dd></div>
            <div><dt>Created</dt><dd>{order.created_at ? dayjs(order.created_at).format('DD MMM YYYY') : '—'}</dd></div>
            <div><dt>Last updated</dt><dd>{order.updated_at ? dayjs(order.updated_at).format('DD MMM YYYY') : '—'}</dd></div>
          </dl>
          {order.notes && <div className={detailStyles.notes}><label>Procurement notes</label><p>{order.notes}</p></div>}
        </section>
        <section className={detailStyles.panel} aria-label="Order line items and payments">
        <Tabs
          key={order.id}
          className={detailStyles.tabs}
          defaultActiveKey="items"
          items={[
            {
              key: 'items',
              label: `Line items (${itemsData?.pagination?.count ?? items.length})`,
              children: (
                <div>
                  <div className={detailStyles.tableToolbar}>
                    <p>Pricing, quantities and linked assets.</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setIsAddItemOpen(true)}
                    >
                      Add Line Item
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={itemColumns}
                    dataSource={items}
                    loading={itemsLoading}
                    locale={{ emptyText: <div className={detailStyles.empty}><strong>No line items yet</strong><p>Add the first item to start recording quantities, prices and assets.</p></div> }}
                    pagination={false}
                    size="small"
                    className={styles.detailTable}
                    scroll={{ x: 960 }}
                    expandable={{
                      expandedRowRender: (record) => (
                        <AllocatedResourcesSubTable
                          purchaseItemId={record.id}
                          currency={order.currency}
                        />
                      ),
                      defaultExpandAllRows: false,
                    }}
                  />
                </div>
              ),
            },
            {
              key: 'transactions',
              label: `Payments (${transactionsData?.pagination?.count ?? transactions.length})`,
              children: (
                <div>
                  <div className={detailStyles.tableToolbar}>
                    <p>Payment and refund records for this order.</p>
                    <Button
                      type="primary"
                      icon={<DollarOutlined />}
                      onClick={() => setIsAddTransactionOpen(true)}
                    >
                      Record Payment / Refund
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={transactionColumns}
                    dataSource={transactions}
                    loading={transactionsLoading}
                    locale={{ emptyText: <div className={detailStyles.empty}><strong>No payments recorded</strong><p>Record a payment or refund to track settlement for this order.</p></div> }}
                    pagination={false}
                    size="small"
                    className={styles.detailTable}
                    scroll={{ x: 700 }}
                  />
                </div>
              ),
            },
          ]}
        />
        </section>
        </div>
      </Drawer>

      <AddPurchaseItemModal
        open={isAddItemOpen}
        purchaseId={order.id}
        currency={order.currency}
        onClose={() => setIsAddItemOpen(false)}
        onSuccess={() => void refetchItems()}
      />

      <AddPurchaseTransactionModal
        open={isAddTransactionOpen}
        purchaseId={order.id}
        currency={order.currency}
        onClose={() => setIsAddTransactionOpen(false)}
        onSuccess={() => void refetchTransactions()}
      />

      <AllocateResourceModal
        open={Boolean(allocatingItem)}
        purchaseItemId={allocatingItem?.id ?? 0}
        itemDescription={allocatingItem?.description ?? ''}
        defaultAcquisitionPrice={allocatingItem?.unit_price}
        currency={order.currency}
        onClose={() => setAllocatingItem(null)}
        onSuccess={() => void refetchItems()}
      />

      <EditPurchaseItemModal
        open={Boolean(editingItem)}
        purchaseId={order.id}
        item={editingItem}
        currency={order.currency}
        onClose={() => setEditingItem(null)}
        onSuccess={() => void refetchItems()}
      />

      <EditPurchaseDraftModal
        open={isEditDraftOpen}
        purchase={order}
        onClose={() => setIsEditDraftOpen(false)}
        onSuccess={() => {
          void refetchItems();
          void refetchTransactions();
        }}
      />
    </>
  );
};
