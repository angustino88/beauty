import React, { useState } from 'react';
import {
  DatePicker,
  Row,
  Col,
  Select,
  Tabs,
  Button,
} from 'antd';
import { InlineAlert } from '@/shared/notifications';
import {
  ReloadOutlined,
  FundOutlined,
  PieChartOutlined,
  TableOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { WorkspaceHero } from '../components/FinanceWorkspace';
import styles from '../components/FinanceWorkspace.module.css';
import {
  useGetFinancialReportQuery,
  useGetFinanceSummaryQuery,
  useGetFinanceMonthlyTrendsQuery,
  useGetFinanceExpenseTypeBreakdownQuery,
} from '../api';
import { useGetExpenseRoomsQuery } from '../../expense/api';
import { FinanceSummaryCards } from '../components/FinanceSummaryCards';
import { FinanceTrendsChart } from '../components/FinanceTrendsChart';
import { ExpenseBreakdownChart } from '../components/ExpenseBreakdownChart';
import { RoomExpenditureChart } from '../components/RoomExpenditureChart';
import { FinancialReportItemsTable } from '../components/FinancialReportItemsTable';
import { FinanceCashFlowBreakdown } from '../components/FinanceCashFlowBreakdown';

const CURRENCY_OPTIONS = [
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'USD ($)', value: 'USD' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'JPY (¥)', value: 'JPY' },
  { label: 'CHF (Fr)', value: 'CHF' },
];

export const FinanceReportPage: React.FC = () => {
  const [currency, setCurrency] = useState('EUR');
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('trends');

  // Default to 6-month window
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(5, 'month').startOf('month'),
    dayjs().endOf('month'),
  ]);

  const { data: rooms = [] } = useGetExpenseRoomsQuery();

  const fromDateStr = dateRange[0].format('YYYY-MM-DD');
  const toDateStr = dateRange[1].format('YYYY-MM-DD');
  const startMonthStr = dateRange[0].format('YYYY-MM');
  const endMonthStr = dateRange[1].format('YYYY-MM');

  const {
    data: reportData,
    isFetching: reportLoading,
    error: reportError,
    refetch: refetchReport,
  } = useGetFinancialReportQuery({
    currency,
    from_date: fromDateStr,
    to_date: toDateStr,
    room_id: selectedRoomId,
  });

  const {
    data: summaryData,
    isFetching: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetFinanceSummaryQuery({
    currency,
    start_month: startMonthStr,
    end_month: endMonthStr,
  });

  const {
    data: trendsData,
    isFetching: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useGetFinanceMonthlyTrendsQuery({
    currency,
    start_month: startMonthStr,
    end_month: endMonthStr,
  });

  const {
    data: breakdownData,
    isFetching: breakdownLoading,
    error: breakdownError,
    refetch: refetchBreakdown,
  } = useGetFinanceExpenseTypeBreakdownQuery({
    currency,
    start_month: startMonthStr,
    end_month: endMonthStr,
  });

  const handleRefresh = () => {
    void refetchReport();
    void refetchSummary();
    void refetchTrends();
    void refetchBreakdown();
  };

  const isAnyLoading = reportLoading || summaryLoading || trendsLoading || breakdownLoading;
  const analyticsError = summaryError ?? trendsError ?? breakdownError;
  const analyticsStatus = analyticsError && 'status' in analyticsError ? analyticsError.status : undefined;
  const analyticsErrorMessage = analyticsStatus === 429
    ? 'Finance request limit reached. Please wait before refreshing.'
    : analyticsStatus === 403 ? 'You do not have permission to view finance analytics.'
      : analyticsStatus === 400 ? 'Invalid reporting period or currency.'
        : 'Unable to load finance analytics. Please retry.';

  return (
    <div className={`${styles.workspace} ${styles.register}`}>
      <WorkspaceHero
        eyebrow="Finance / Analysis & reporting"
        title="Financial overview"
        description="A clear view of cash flow, commitments and where your lab's resources are going."
        icon={<BarChartOutlined />}
      />

      <section className={styles.surface} aria-label="Report controls">
        <div className={styles.surfaceHeading}>
          <div><h2 className={styles.surfaceTitle}>Report parameters</h2><p className={styles.surfaceDescription}>Choose a reporting period and currency to explore the numbers.</p></div>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <div className={styles.filterField}>
              <label htmlFor="report-currency">Currency</label>
              <Select
                id="report-currency"
                value={currency}
                onChange={setCurrency}
                options={CURRENCY_OPTIONS}
                style={{ width: 130 }}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="report-room">Facility / room</label>
              <Select
                id="report-room"
                allowClear
                placeholder="All rooms"
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                style={{ width: 180 }}
                options={rooms.map((r) => ({ label: r.name, value: r.id }))}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="report-dates">Reporting period</label>
              <DatePicker.RangePicker
                id="report-dates"
                allowClear={false}
                value={dateRange}
                disabledDate={(date, info) => {
                  if (date.isAfter(dayjs().endOf('day'))) return true;
                  if (!info.from) return false;
                  const earliest = info.from.startOf('month').subtract(23, 'month');
                  const latest = info.from.startOf('month').add(23, 'month').endOf('month');
                  return date.isBefore(earliest, 'day') || date.isAfter(latest, 'day');
                }}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    const months = dates[1].startOf('month').diff(dates[0].startOf('month'), 'month');
                    if (months >= 0 && months < 24) setDateRange([dates[0], dates[1]]);
                  }
                }}
                style={{ width: 250 }}
              />
            </div>
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isAnyLoading}>
            Refresh report
          </Button>
        </div>
      </section>

      {analyticsError && (
        <InlineAlert
          variant="error"
          title={analyticsErrorMessage}
          onRetry={handleRefresh}
        />
      )}
      {reportError && (
        <InlineAlert
          variant="error"
          title="Unable to load the expense report"
          description="Try refreshing the report."
          onRetry={() => void refetchReport()}
        />
      )}

      {/* Summary KPI Cards */}
      <FinanceSummaryCards
        currency={currency}
        reportSummary={reportError ? undefined : reportData?.summary}
        analyticsSummary={summaryError ? undefined : summaryData}
      />

      {/* Main Tabs */}
      <Tabs
        className={styles.tabs}
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'trends',
            label: (
              <span>
                <FundOutlined /> Cash flow & trends
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FinanceTrendsChart
                  currency={currency}
                  data={trendsError ? [] : trendsData?.months ?? []}
                  loading={trendsLoading}
                />
              </div>
            ),
          },
          {
            key: 'breakdown',
            label: (
              <span>
                <PieChartOutlined /> Spend allocation
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FinanceCashFlowBreakdown breakdown={breakdownError ? undefined : breakdownData} />
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <ExpenseBreakdownChart
                      currency={currency}
                      data={reportError ? [] : reportData?.by_expense_type ?? []}
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    <RoomExpenditureChart
                      currency={currency}
                      data={reportError ? [] : reportData?.by_room ?? []}
                    />
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'ledger',
            label: (
              <span>
                <TableOutlined /> Expense ledger
              </span>
            ),
            children: (
              <FinancialReportItemsTable
                items={reportError ? [] : reportData?.items ?? []}
                currency={currency}
                loading={reportLoading}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default FinanceReportPage;
