import React from 'react';
import { ArrowDownOutlined, ClockCircleOutlined, FileDoneOutlined, SwapOutlined } from '@ant-design/icons';
import type { IFinanceSummary, IFinancialReportSummary } from '../types';
import { MetricCard } from './FinanceWorkspace';
import { formatMoney } from './formatMoney';
import styles from './FinanceWorkspace.module.css';

interface FinanceSummaryCardsProps {
  currency: string;
  reportSummary?: IFinancialReportSummary;
  analyticsSummary?: IFinanceSummary;
}

export const FinanceSummaryCards: React.FC<FinanceSummaryCardsProps> = ({
  currency,
  reportSummary,
  analyticsSummary,
}) => {
  const expensePaid = analyticsSummary?.sources?.expense?.payments ?? 0;
  const procurementPaid = analyticsSummary?.sources?.procurement?.payments ?? 0;

  return (
    <div className={styles.metricGrid}>
      <MetricCard label="Budgeted obligations" value={reportSummary ? formatMoney(reportSummary.total_budgeted, currency) : '—'} note={`${reportSummary?.expense_count ?? 0} facility expense items`} icon={<FileDoneOutlined />} />
      <MetricCard label="Settled cash outflow" value={analyticsSummary ? formatMoney(analyticsSummary.combined.payments, currency) : '—'} note="Facility and procurement payments" icon={<ArrowDownOutlined />} accent="#38789a" tint="#eaf3f8" />
      <MetricCard label="Pending obligations" value={reportSummary ? formatMoney(reportSummary.total_pending, currency) : '—'} note="Outstanding facility expense balance" icon={<ClockCircleOutlined />} accent="#aa7532" tint="#fcf3e6" />
      <MetricCard label="Payment sources" value={analyticsSummary ? formatMoney(expensePaid + procurementPaid, currency) : '—'} note={analyticsSummary ? `Facilities ${formatMoney(expensePaid, currency)} · Purchases ${formatMoney(procurementPaid, currency)}` : 'Facility and procurement payments'} icon={<SwapOutlined />} accent="#7a668f" tint="#f2eff7" />
    </div>
  );
};
