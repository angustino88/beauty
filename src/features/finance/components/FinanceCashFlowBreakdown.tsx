import { Card, Empty, Table, Typography } from 'antd';
import type { IFinanceExpenseTypeBreakdown } from '../types';
import { formatMoney } from './formatMoney';
import styles from './FinanceWorkspace.module.css';

export function FinanceCashFlowBreakdown({ breakdown }: { breakdown?: IFinanceExpenseTypeBreakdown }) {
  return (
    <Card className={styles.chartCard} title="Actual cash flow by source and category">
      <Typography.Paragraph type="secondary">
        Payments and signed refunds, grouped by expense category and source. No currency conversion or purchase commitments.
      </Typography.Paragraph>
      <Table
        rowKey={(row) => `${row.source}:${row.expense_type}`}
        dataSource={breakdown?.items ?? []}
        pagination={false}
        scroll={{ x: 720 }}
        locale={{ emptyText: <Empty description="No cash-flow transactions for this period" /> }}
        columns={[
          { title: 'Source', dataIndex: 'source', render: (value: string) => value === 'procurement' ? 'Procurement' : 'Expense' },
          { title: 'Category', dataIndex: 'expense_type_label' },
          { title: 'Payments', dataIndex: 'payments', align: 'right', render: (value: number) => formatMoney(value, breakdown?.currency ?? 'EUR') },
          { title: 'Refunds', dataIndex: 'refunds', align: 'right', render: (value: number) => formatMoney(value, breakdown?.currency ?? 'EUR') },
          { title: 'Net', dataIndex: 'net', align: 'right', render: (value: number) => formatMoney(value, breakdown?.currency ?? 'EUR') },
          { title: 'Transactions', dataIndex: 'transaction_count', align: 'right' },
        ]}
      />
    </Card>
  );
}
