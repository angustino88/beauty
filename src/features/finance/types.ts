export interface IFinancialReportSummary {
  total_budgeted: number;
  total_paid: number;
  total_pending: number;
  total_refunded: number;
  expense_count: number;
  payment_count: number;
}

export interface IFinancialReportTypeBreakdown {
  expense_type: string;
  expense_type_label: string;
  count: number;
  amount: number;
  paid_amount: number;
  pending_amount: number;
}

export interface IFinancialReportRoomBreakdown {
  room_id: number;
  room_name: string;
  count: number;
  amount: number;
  paid_amount: number;
  pending_amount: number;
}

export interface IFinancialReportStatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

export interface IFinancialReportPeriodBreakdown {
  billing_period: string;
  count: number;
  amount: number;
  paid_amount: number;
}

export interface IFinancialReportItem {
  id: number;
  name: string;
  expense_type: string;
  expense_type_label: string;
  amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: 'paid' | 'partial' | 'pending' | 'overdue' | string;
  currency: string;
  billing_period: string;
  supplier?: string;
  reference?: string;
  valid_from: string;
  valid_until?: string | null;
  room_id: number;
  room_name: string;
}

export interface IFinancialReport {
  currency: string;
  summary: IFinancialReportSummary;
  by_expense_type: IFinancialReportTypeBreakdown[];
  by_room: IFinancialReportRoomBreakdown[];
  by_status: IFinancialReportStatusBreakdown[];
  by_billing_period: IFinancialReportPeriodBreakdown[];
  items: IFinancialReportItem[];
}

export interface IFinanceTotals {
  payments: number;
  refunds: number;
  net: number;
  transaction_count: number;
}

export interface IFinanceSummary {
  currency: string;
  start_month: string;
  end_month: string;
  combined: IFinanceTotals;
  sources: {
    expense: IFinanceTotals;
    procurement: IFinanceTotals;
  };
}

export interface IFinanceMonthTrend {
  month: string;
  combined: IFinanceTotals;
  sources: {
    expense: IFinanceTotals;
    procurement: IFinanceTotals;
  };
}

export interface IFinanceMonthlyTrends {
  currency: string;
  months: IFinanceMonthTrend[];
}

export interface IFinanceExpenseTypeBreakdownItem {
  expense_type: string;
  expense_type_label: string;
  source: 'expense' | 'procurement' | string;
  payments: number;
  refunds: number;
  net: number;
  transaction_count: number;
}

export interface IFinanceExpenseTypeBreakdown {
  currency: string;
  items: IFinanceExpenseTypeBreakdownItem[];
}

export interface IFinancialReportFilterParams {
  currency?: string;
  billing_period?: string;
  expense_type?: string;
  from_date?: string;
  to_date?: string;
  room_id?: number;
  status?: string;
}

export interface IFinanceAnalyticsParams {
  currency: string;
  start_month: string;
  end_month: string;
  timezone?: string;
}
