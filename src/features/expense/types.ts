export type ExpenseTypeEnum =
  | 'rent'
  | 'utilities'
  | 'maintenance'
  | 'calibration'
  | 'repair'
  | 'service_contract'
  | 'license_fee'
  | 'insurance'
  | 'service'
  | 'other';

export type BillingPeriodEnum = 'one_time' | 'monthly' | 'quarterly' | 'annual';

export type ExpenseResourceKind = 'room' | 'station' | 'bench' | 'equipment' | 'license';

export interface IExpense {
  id: number;
  resource_kind: ExpenseResourceKind;
  resource_kind_label: string;
  resource_id: number;
  resource_name?: string;
  room_id: number;
  room_name?: string;
  name: string;
  expense_type: ExpenseTypeEnum;
  expense_type_label: string;
  supplier?: string;
  reference?: string;
  amount: string;
  currency: string;
  amount_display?: string;
  billing_period: BillingPeriodEnum;
  billing_period_label: string;
  valid_from: string;
  valid_until?: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IExpensePayment {
  id: number;
  expense_id?: number;
  transaction_type: 'payment' | 'refund';
  amount: string;
  paid_at: string;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IExpenseListPagination {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

export interface IExpenseListResponse {
  data: IExpense[];
  pagination: IExpenseListPagination;
}

export interface IExpenseQueryParams {
  roomId?: number;
  resource_kind?: ExpenseResourceKind;
  resource_id?: number;
  page?: number;
  page_size?: number;
  search?: string;
  expense_type?: ExpenseTypeEnum;
  billing_period?: BillingPeriodEnum;
}

export interface ICreateExpensePayload {
  resource_kind?: ExpenseResourceKind;
  resource_id?: number;
  name: string;
  expense_type: ExpenseTypeEnum;
  amount: string;
  valid_from: string;
  supplier?: string;
  reference?: string;
  currency?: string;
  billing_period?: BillingPeriodEnum;
  valid_until?: string | null;
  notes?: string;
}

export interface ICreateExpensePaymentPayload {
  transaction_type?: 'payment' | 'refund';
  /** Payment money uses the expense's currency (the API rejects another currency with 422). */
  currency: string;
  amount: string;
  paid_at: string;
  reference?: string;
  notes?: string;
}
