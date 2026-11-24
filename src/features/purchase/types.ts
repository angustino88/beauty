export type TransactionType = 'payment' | 'refund';
export type ResourceKind = 'bench' | 'equipment' | 'license' | 'station';

export interface IPurchasePriority {
  id: number;
  code: string;
  name: string;
}

export interface IPurchaseItem {
  id: number;
  purchase_id?: number;
  description: string;
  quantity: number;
  unit?: string;
  unit_price: string;
  line_value?: string;
  priority_id?: number;
  priority_code?: string;
  priority_name?: string;
  purpose?: string;
  notes?: string;
  version?: number;
  etag?: string;
  created_at: string;
}

export interface IPurchaseTransaction {
  id: number;
  purchase_id?: number;
  transaction_type: TransactionType;
  amount: string;
  settled_at: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface IPurchaseItemResource {
  id: number;
  purchase_item_id: number;
  resource_kind?: ResourceKind;
  resource_id: number;
  resource_name?: string;
  acquisition_price?: string;
  created_at: string;
}

export interface IPurchase {
  id: number;
  supplier: string;
  purchase_order_number: string;
  purchase_date: string;
  currency: string;
  status: string;
  status_label?: string;
  total_amount: string;
  total_display?: string;
  item_count: number;
  notes?: string;
  version?: number;
  etag?: string;
  created_at: string;
  updated_at: string;
  items?: IPurchaseItem[];
}

export interface IPurchaseListPagination {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

export interface IPurchaseListResponse {
  data: IPurchase[];
  pagination: IPurchaseListPagination;
}

export interface IPurchaseQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  supplier?: string;
  currency?: string;
  status?: string;
}

export interface ICreatePurchasePayload {
  supplier: string;
  purchase_order_number?: string;
  purchase_date: string;
  currency?: string;
  total_amount: string;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    unit_price: string;
    unit?: string;
    purpose?: string;
    priority_id?: number;
    notes?: string;
  }[];
}

export interface ICreatePurchaseItemPayload {
  description: string;
  quantity: number;
  /** Line money uses the purchase currency (wire: `unit_price: {amount, currency}`). */
  currency: string;
  unit_price: string;
  unit?: string;
  purpose?: string;
  priority_id?: number;
  notes?: string;
}

export interface IUpdatePurchaseItemPayload {
  description?: string;
  quantity?: number;
  currency: string;
  unit_price?: string;
  unit?: string;
  purpose?: string;
  priority_id?: number;
  notes?: string;
}

export interface IUpdatePurchaseDraftHeaderPayload {
  supplier?: string;
  purchase_date?: string;
  purchase_order_number?: string;
  currency?: string;
  total_amount?: string;
  status?: string;
  notes?: string;
}

export interface ICreatePurchaseTransactionPayload {
  transaction_type: TransactionType;
  currency: string;
  amount: string;
  settled_at: string;
  reference?: string;
  notes?: string;
}

export interface IAllocateResourcePayload {
  resource_kind: ResourceKind;
  resource_id: number;
  currency: string;
  acquisition_price: string;
}
