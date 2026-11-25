import React, { useState } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Table,
  Button,
  Space,
  Typography,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  DollarOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { IExpense, IExpensePayment } from '../types';
import { EXPENSE_TYPE_COLORS } from '../mapper';
import { useGetExpensePaymentsQuery } from '../api';
import { RecordExpensePaymentModal } from './RecordExpensePaymentModal';

interface ExpenseDetailDrawerProps {
  open: boolean;
  expense: IExpense | null;
  onClose: () => void;
}

export const ExpenseDetailDrawer: React.FC<ExpenseDetailDrawerProps> = ({
  open,
  expense,
  onClose,
}) => {
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);

  const expenseId = expense?.id ?? 0;

  const {
    data: paymentsData,
    isFetching: paymentsLoading,
    refetch: refetchPayments,
  } = useGetExpensePaymentsQuery(
    { expenseId },
    { skip: !expenseId || !open },
  );

  if (!expense) return null;

  const payments = paymentsData?.data ?? [];

  const totalPaid = payments
    .filter((p) => p.transaction_type === 'payment')
    .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

  const totalRefunded = payments
    .filter((p) => p.transaction_type === 'refund')
    .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);

  const netPaid = totalPaid - totalRefunded;

  const paymentColumns = [
    {
      title: 'Type',
      dataIndex: 'transaction_type',
      key: 'transaction_type',
      width: 110,
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
      render: (amount: string, record: IExpensePayment) => (
        <strong style={{ color: record.transaction_type === 'refund' ? 'var(--lm-warning-fg)' : 'var(--lm-success-fg)' }}>
          {record.transaction_type === 'refund' ? '-' : '+'} {expense.currency}{' '}
          {parseFloat(amount || '0').toFixed(2)}
        </strong>
      ),
    },
    {
      title: 'Paid Date',
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '—'),
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
          <Space>
            <WalletOutlined style={{ color: 'var(--lm-success-fg)' }} />
            <span>Expense #{expense.id}: {expense.name}</span>
          </Space>
        }
        placement="right"
        width={800}
        open={open}
        onClose={onClose}
      >
        <Descriptions bordered size="small" column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
          <Descriptions.Item label="Expense Name">
            <strong>{expense.name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Resource">
            <Space size={6}>
              <Tag>{expense.resource_kind_label}</Tag>
              <span>{expense.resource_name || `${expense.resource_kind_label} #${expense.resource_id}`}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Expense Type">
            <Tag color={EXPENSE_TYPE_COLORS[expense.expense_type]}>
              {expense.expense_type_label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Billing Period">
            <Tag color="cyan">{expense.billing_period_label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Period Amount">
            <Typography.Text strong style={{ fontSize: 16 }}>
              {expense.currency} {parseFloat(expense.amount).toFixed(2)}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Supplier">
            {expense.supplier || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Valid From">
            {expense.valid_from}
          </Descriptions.Item>
          <Descriptions.Item label="Valid Until">
            {expense.valid_until || 'Ongoing'}
          </Descriptions.Item>
          <Descriptions.Item label="Reference">
            {expense.reference || '—'}
          </Descriptions.Item>
          {expense.notes && (
            <Descriptions.Item label="Notes" span={3}>
              {expense.notes}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Row gutter={16} style={{ marginTop: 16, marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Agreed Rate"
                value={parseFloat(expense.amount)}
                precision={2}
                prefix={expense.currency}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Total Paid"
                value={netPaid}
                precision={2}
                prefix={expense.currency}
                valueStyle={{ color: 'var(--lm-success-fg)' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Payment Count"
                value={payments.length}
                suffix="transactions"
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Payment & Settlement History
            </Typography.Title>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              size="small"
              onClick={() => setIsRecordPaymentOpen(true)}
            >
              Record Payment
            </Button>
          </div>

          <Table
            rowKey="id"
            columns={paymentColumns}
            dataSource={payments}
            loading={paymentsLoading}
            pagination={false}
            size="small"
            bordered
          />
        </div>
      </Drawer>

      <RecordExpensePaymentModal
        open={isRecordPaymentOpen}
        expenseId={expense.id}
        expenseName={expense.name}
        currency={expense.currency}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={() => void refetchPayments()}
      />
    </>
  );
};
