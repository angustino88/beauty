import React, { useMemo, useState } from 'react';
import { Button, Space, Table, Typography } from 'antd';
import { notify } from '@/shared/notifications';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined } from '@ant-design/icons';
import { FullTextSearch } from '@/components/inputs/FullTextSearch';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import type { IFinancialReportItem } from '../types';
import tableStyles from '@/components/tables/AppTable.module.css';
import { formatMoney } from './formatMoney';
import styles from './FinanceWorkspace.module.css';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { paymentStatusTone, purchaseStatusLabel } from '@/shared/status/statusTone';

interface FinancialReportItemsTableProps {
  items: IFinancialReportItem[];
  currency: string;
  loading?: boolean;
}

export const FinancialReportItemsTable: React.FC<FinancialReportItemsTableProps> = ({
  items,
  currency,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    const term = debouncedSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.room_name.toLowerCase().includes(term) ||
        item.supplier?.toLowerCase().includes(term) ||
        item.reference?.toLowerCase().includes(term) ||
        item.expense_type_label.toLowerCase().includes(term),
    );
  }, [items, debouncedSearch]);

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Finance Ledger');

      sheet.addRow([
        'ID',
        'Expense Name',
        'Room',
        'Category',
        'Cycle',
        `Budgeted (${currency})`,
        `Paid (${currency})`,
        `Pending (${currency})`,
        'Payment Status',
        'Supplier',
        'Reference',
        'Valid From',
        'Valid Until',
      ]);

      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F7A4D' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      for (const it of filteredItems) {
        sheet.addRow([
          it.id,
          it.name,
          it.room_name,
          it.expense_type_label,
          it.billing_period,
          it.amount,
          it.paid_amount,
          it.pending_amount,
          it.payment_status.toUpperCase(),
          it.supplier || '',
          it.reference || '',
          it.valid_from,
          it.valid_until || 'Ongoing',
        ]);
      }

      sheet.columns.forEach((col) => {
        col.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Financial_Report_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      notify.success('Financial report exported', {
        description: 'Your Excel ledger download has started.',
      });
    } catch {
      notify.error('Unable to export financial report', {
        description: 'Please try again.',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const columns: ColumnsType<IFinancialReportItem> = [
    {
      title: 'Expense Item',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: IFinancialReportItem) => (
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
      render: (_: string | undefined, record: IFinancialReportItem) => (
        <Space size={6}>
          {record.resource_kind_label && <span className={styles.mutedTag}>{record.resource_kind_label}</span>}
          <span>{record.resource_name || record.room_name}</span>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'expense_type',
      key: 'expense_type',
      width: 140,
      render: (type: string, record: IFinancialReportItem) => {
        return <span className={styles.mutedTag}>{record.expense_type_label || type}</span>;
      },
    },
    {
      title: 'Cycle',
      dataIndex: 'billing_period',
      key: 'billing_period',
      width: 100,
      render: (cycle: string) => <span className={styles.mutedTag}>{cycle.replaceAll('_', ' ')}</span>,
    },
    {
      title: `Budgeted (${currency})`,
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (val: number) => <span className={styles.amount}>{formatMoney(val, currency)}</span>,
    },
    {
      title: `Paid (${currency})`,
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      align: 'right',
      render: (val: number) => (
        <span className={styles.amount}>{formatMoney(val, currency)}</span>
      ),
    },
    {
      title: `Pending (${currency})`,
      dataIndex: 'pending_amount',
      key: 'pending_amount',
      align: 'right',
      render: (val: number) => (
        <span style={{ color: val > 0 ? 'var(--lm-warning-fg)' : 'var(--lm-text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(val, currency)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      align: 'left',
      width: 120,
      render: (status: string) => {
        return <StatusBadge tone={paymentStatusTone(status)} label={purchaseStatusLabel(status)} />;
      },
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (sup?: string) => sup || <Typography.Text type="secondary">—</Typography.Text>,
    },
  ];

  return (
    <section className={styles.surface} aria-label="Detailed expense ledger">
      <div className={styles.surfaceHeading}>
        <div><h2 className={styles.surfaceTitle}>Expense ledger</h2><p className={styles.surfaceDescription}>Item-level commitments and payment status for your selected period.</p></div>
        <span className={styles.count}>{filteredItems.length.toLocaleString()} entries</span>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.filterSearch}>
          <FullTextSearch
            value={search}
            onSearch={setSearch}
            placeholder="Search items, room, supplier, reference..."
          />
        </div>

        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            loading={exportLoading}
          >
            Export to Excel
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredItems}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`,
        }}
        className={`${tableStyles.table} ${styles.tableWrap}`}
        scroll={{ x: 1160 }}
        size="middle"
      />
    </section>
  );
};
