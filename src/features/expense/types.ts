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

export interface IExpense {
  id: number;
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
  roomId: number;
  page?: number;
  page_size?: number;
  search?: string;
  expense_type?: ExpenseTypeEnum;
  billing_period?: BillingPeriodEnum;
}

export interface ICreateExpensePayload {
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
  amount: string;
  paid_at: string;
  reference?: string;
  notes?: string;
}
